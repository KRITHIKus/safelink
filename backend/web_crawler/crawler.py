import asyncio
import aiohttp
import random
import time
import logging
import os
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, WebDriverException
import cloudinary.uploader

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [CRAWLER] %(levelname)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── Chrome binary paths (set by build.sh on Render) ───────────────────────────
CHROME_BINARY       = "/opt/render/project/src/chrome/chrome/chrome"
CHROMEDRIVER_BINARY = "/opt/render/project/src/chrome/chromedriver/chromedriver"

# ── Timeouts ───────────────────────────────────────────────────────────────────
#
# PAGE_LOAD_TIMEOUT — how long Selenium waits for driver.get() to return.
# With page_load_strategy="eager" this fires at DOMContentLoaded, not full load.
PAGE_LOAD_TIMEOUT = 25

# DOM_WAIT_TIMEOUT — how long WebDriverWait polls for readyState.
# Heavy pages (GeeksForGeeks, news sites) take 60-70s on Render free CPU.
# We cap at 8s and take the screenshot anyway — the page is usually visible.
DOM_WAIT_TIMEOUT = 8

# SCREENSHOT_TASK_TIMEOUT — hard ceiling on the ENTIRE screenshot pipeline.
# This is the critical fix for the 300-500s hang seen in the logs.
#
# What happened: get_screenshot_as_png() communicates with ChromeDriver over
# an internal HTTP connection. On heavy pages Chrome's renderer is still busy,
# so the /screenshot endpoint never responds. urllib3 (Selenium's HTTP layer)
# has a default read timeout of 120s and retries 3 times automatically.
# Result: 3 × 120s = 360s of silent hanging before any error appears.
#
# Fix: asyncio.wait_for() wraps the entire asyncio.to_thread(selenium_task)
# call. After SCREENSHOT_TASK_TIMEOUT seconds the task is cancelled, Chrome
# is killed in the finally block, and we return None (no screenshot).
# The crawler still returns title + description — only screenshot is missing.
SCREENSHOT_TASK_TIMEOUT = 45

# aiohttp request timeout for HTML fetch
FETCH_TIMEOUT = aiohttp.ClientTimeout(total=20, connect=8)

# ── User-agents ────────────────────────────────────────────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
]


# ─────────────────────────────────────────────────────────────────────────────
# Chrome setup
# ─────────────────────────────────────────────────────────────────────────────

def _ensure_chrome_exists() -> bool:
    if not os.path.exists(CHROME_BINARY):
        logger.error(f"Chrome binary not found: {CHROME_BINARY}")
        return False
    if not os.path.exists(CHROMEDRIVER_BINARY):
        logger.error(f"ChromeDriver not found: {CHROMEDRIVER_BINARY}")
        return False
    os.chmod(CHROME_BINARY, 0o755)
    os.chmod(CHROMEDRIVER_BINARY, 0o755)
    return True


def _build_chrome_options() -> Options:
    opts = Options()
    opts.binary_location = CHROME_BINARY

    # Core headless flags
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")

    # Performance — skip everything not needed for a screenshot
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--disable-plugins")
    opts.add_argument("--disable-background-networking")
    opts.add_argument("--disable-background-timer-throttling")
    opts.add_argument("--disable-backgrounding-occluded-windows")
    opts.add_argument("--disable-renderer-backgrounding")
    opts.add_argument("--disable-translate")
    opts.add_argument("--disable-sync")
    opts.add_argument("--disable-default-apps")
    opts.add_argument("--disable-software-rasterizer")
    opts.add_argument("--disable-crash-reporter")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--safebrowsing-disable-auto-update")
    opts.add_argument("--metrics-recording-only")
    opts.add_argument("--mute-audio")

    # Fixed viewport
    opts.add_argument("--window-size=1280,900")

    # Block images — stops image HTTP requests from holding up page load
    opts.add_argument("--blink-settings=imagesEnabled=false")

    # Memory limits for Render free tier (512MB RAM)
    opts.add_argument("--memory-pressure-off")
    opts.add_argument("--js-flags=--max-old-space-size=256")

    return opts


def _setup_driver() -> webdriver.Chrome | None:
    if not _ensure_chrome_exists():
        return None

    opts = _build_chrome_options()
    # "eager" = fire at DOMContentLoaded, not full network idle
    opts.page_load_strategy = "eager"

    try:
        service = Service(CHROMEDRIVER_BINARY)
        driver = webdriver.Chrome(service=service, options=opts)
        driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
        logger.info("ChromeDriver initialised successfully")
        return driver
    except WebDriverException as e:
        logger.error(f"ChromeDriver init failed: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Screenshot capture — with hard timeout guard
# ─────────────────────────────────────────────────────────────────────────────

async def capture_screenshot(url: str, domain: str) -> str | None:
    """
    Capture a screenshot and upload to Cloudinary.

    The entire pipeline (Chrome nav + screenshot + Cloudinary upload) is wrapped
    in asyncio.wait_for(SCREENSHOT_TASK_TIMEOUT). If Chrome hangs on a heavy
    page, the task is cancelled after 45 seconds and None is returned.
    The crawler still returns title and description — only screenshot is skipped.

    This fixes the 300-500s hang caused by urllib3 retrying the
    /screenshot ChromeDriver endpoint 3 × 120s on pages like GeeksForGeeks.
    """

    def _selenium_task() -> str | None:
        driver = _setup_driver()
        if driver is None:
            return None

        try:
            logger.info(f"Navigating to {url}")

            try:
                driver.get(url)
            except TimeoutException:
                # page_load_strategy="eager" times out on slow resource loads
                # but DOM is usually ready — attempt screenshot anyway
                logger.warning(f"Page load timed out for {url} — attempting screenshot anyway")
            except WebDriverException as e:
                logger.error(f"Navigation failed for {url}: {e}")
                return None

            # Wait for DOM readiness — capped at DOM_WAIT_TIMEOUT seconds.
            # We do NOT wait longer than this even on heavy pages.
            # The screenshot will capture whatever is rendered at that point.
            try:
                WebDriverWait(driver, DOM_WAIT_TIMEOUT).until(
                    lambda d: d.execute_script("return document.readyState") in ("interactive", "complete")
                )
                logger.info(f"DOM ready for {url}")
            except TimeoutException:
                logger.warning(f"DOM not ready within {DOM_WAIT_TIMEOUT}s for {url} — taking screenshot anyway")

            # get_screenshot_as_png() — this is where the hang occurs on heavy pages.
            # The asyncio.wait_for() wrapping this entire coroutine is the actual
            # timeout guard. If Chrome's renderer doesn't respond, the task is
            # cancelled externally. We still need the try/except here for non-timeout
            # exceptions like OOM or renderer crash.
            logger.info(f"Capturing screenshot for {url}")
            try:
                png_bytes = driver.get_screenshot_as_png()
            except Exception as e:
                logger.error(f"get_screenshot_as_png failed for {url}: {e}")
                return None

            if not png_bytes:
                logger.error("Screenshot returned empty bytes")
                return None

            cloudinary_id = f"{domain}_{int(time.time())}"
            logger.info(f"Uploading screenshot to Cloudinary: {cloudinary_id}")

            try:
                response = cloudinary.uploader.upload(
                    png_bytes,
                    public_id=cloudinary_id,
                    overwrite=False,
                    resource_type="image",
                )
                url_result = response.get("secure_url")
                if url_result:
                    logger.info(f"Screenshot uploaded: {url_result}")
                else:
                    logger.error(f"Cloudinary returned no URL. Response: {response}")
                return url_result
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {e}")
                return None

        except Exception as e:
            logger.error(f"Screenshot capture failed: {e}")
            return None

        finally:
            try:
                driver.quit()
            except Exception:
                pass

    # Hard ceiling: if selenium_task takes longer than SCREENSHOT_TASK_TIMEOUT
    # seconds (including Chrome init, navigation, DOM wait, screenshot, and
    # Cloudinary upload), cancel it and return None.
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(_selenium_task),
            timeout=SCREENSHOT_TASK_TIMEOUT,
        )
        return result
    except asyncio.TimeoutError:
        logger.warning(
            f"Screenshot task timed out after {SCREENSHOT_TASK_TIMEOUT}s for {url} "
            f"— returning None (title/description still available)"
        )
        return None
    except Exception as e:
        logger.error(f"Unexpected error in capture_screenshot: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# HTML fetch
# ─────────────────────────────────────────────────────────────────────────────

async def fetch_page_content(url: str, retries: int = 2) -> str | None:
    headers = {"User-Agent": random.choice(USER_AGENTS)}

    async with aiohttp.ClientSession(timeout=FETCH_TIMEOUT) as session:
        for attempt in range(1, retries + 1):
            try:
                async with session.get(url, headers=headers, ssl=False, allow_redirects=True) as resp:
                    if resp.status == 200:
                        return await resp.text(errors="replace")
                    logger.warning(f"HTTP {resp.status} on attempt {attempt} for {url}")
            except asyncio.TimeoutError:
                logger.warning(f"Timeout on attempt {attempt} for {url}")
            except aiohttp.ClientError as e:
                logger.error(f"Client error on attempt {attempt} for {url}: {e}")
            except Exception as e:
                logger.error(f"Unexpected error fetching {url}: {e}")

    logger.error(f"All {retries} fetch attempts failed for {url}")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Main crawl function
# ─────────────────────────────────────────────────────────────────────────────

async def crawl_website(url: str) -> dict:
    """
    Fetch HTML and capture screenshot concurrently.
    If screenshot times out (heavy page), crawl still completes with title/description.
    """
    parsed = urlparse(url)
    domain = parsed.netloc.lower().replace(":", "_")

    logger.info(f"Starting crawl for {url}")

    # Both tasks run in parallel — screenshot timeout does not delay HTML fetch
    html_task       = asyncio.create_task(fetch_page_content(url))
    screenshot_task = asyncio.create_task(capture_screenshot(url, domain))

    page_content, screenshot_url = await asyncio.gather(
        html_task, screenshot_task, return_exceptions=True
    )

    if isinstance(page_content, Exception):
        logger.error(f"HTML fetch raised exception: {page_content}")
        page_content = None

    if isinstance(screenshot_url, Exception):
        logger.error(f"Screenshot raised exception: {screenshot_url}")
        screenshot_url = None

    title       = "No Title"
    description = "No Description"
    is_https    = url.lower().startswith("https://")

    if page_content:
        try:
            soup = BeautifulSoup(page_content, "lxml")
        except Exception:
            soup = BeautifulSoup(page_content, "html.parser")

        if soup.title and soup.title.string:
            title = soup.title.string.strip()[:200]

        meta = soup.find("meta", attrs={"name": "description"})
        if meta and meta.get("content"):
            description = meta["content"].strip()[:500]
    else:
        logger.error(f"No HTML content for {url}")

    result = {
        "url":            url,
        "title":          title,
        "description":    description,
        "screenshot_url": screenshot_url,
        "https":          is_https,
    }

    logger.info(f"Crawl complete for {url} — screenshot: {'yes' if screenshot_url else 'no'}")
    return result