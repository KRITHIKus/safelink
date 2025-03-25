import asyncio
import aiohttp
import random
import time
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import cloudinary.uploader
import logging
import os

# ✅ Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ✅ Corrected Chrome and ChromeDriver paths (Persistent storage)
CHROME_BINARY = "/opt/render/project/src/chrome/chrome/chrome"
CHROMEDRIVER_BINARY = "/opt/render/project/src/chrome/chromedriver/chromedriver"

def ensure_chrome_exists():
    """Ensures Chrome and ChromeDriver exist before running Selenium."""
    if not os.path.exists(CHROME_BINARY):
        logging.error(f"❌ ERROR: Chrome binary not found at {CHROME_BINARY}")
        return False
    if not os.path.exists(CHROMEDRIVER_BINARY):
        logging.error(f"❌ ERROR: ChromeDriver binary not found at {CHROMEDRIVER_BINARY}")
        return False

    # ✅ Ensure both files are executable
    os.chmod(CHROME_BINARY, 0o777)
    os.chmod(CHROMEDRIVER_BINARY, 0o777)

    logging.info(f"✅ Chrome binary found at {CHROME_BINARY}")
    logging.info(f"✅ ChromeDriver binary found at {CHROMEDRIVER_BINARY}")
    return True

def setup_driver():
    """Sets up Selenium WebDriver with Chrome in headless mode."""
    if not ensure_chrome_exists():
        logging.error("❌ Chrome setup failed. Exiting...")
        return None

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--remote-debugging-port=9222")
    chrome_options.add_argument("--disable-background-networking")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-software-rasterizer")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")

    chrome_options.binary_location = CHROME_BINARY

    try:
        service = Service(CHROMEDRIVER_BINARY)
        driver = webdriver.Chrome(service=service, options=chrome_options)
        logging.info("✅ ChromeDriver initialized successfully.")
        return driver
    except Exception as e:
        logging.error(f"❌ ChromeDriver setup failed: {e}")
        return None

async def capture_screenshot(url, domain):
    """Captures a screenshot and uploads it to Cloudinary."""
    def selenium_task():
        driver = setup_driver()
        if not driver:
            logging.error("❌ Driver setup failed. Skipping screenshot.")
            return None

        try:
            logging.info(f"🌐 Navigating to {url}...")
            driver.get(url)
            time.sleep(3)  # ✅ Wait for the page to load

            screenshot_data = driver.get_screenshot_as_png()
            cloudinary_id = f"{domain}_{int(time.time())}"

            logging.info(f"📤 Uploading screenshot to Cloudinary: {cloudinary_id}")
            try:
                response = cloudinary.uploader.upload(screenshot_data, public_id=cloudinary_id, overwrite=False)
                cloudinary_url = response.get("secure_url")
                logging.info(f"✅ Screenshot uploaded successfully: {cloudinary_url}")
                return cloudinary_url
            except Exception as e:
                logging.error(f"❌ Cloudinary upload failed: {e}")
                return None
        except Exception as e:
            logging.error(f"❌ Screenshot capture failed: {e}")
            return None
        finally:
            driver.quit()

    return await asyncio.to_thread(selenium_task)

async def fetch_page_content(url, retries=3):
    """Fetches the HTML content of a webpage asynchronously with retry logic."""
    headers = {"User-Agent": random.choice([
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    ])}

    async with aiohttp.ClientSession() as session:
        for attempt in range(retries):
            try:
                async with session.get(url, headers=headers, timeout=15) as response:
                    if response.status == 200:
                        return await response.text()
                    logging.warning(f"⚠️ Attempt {attempt + 1} failed for {url}. Retrying...")
            except asyncio.TimeoutError:
                logging.warning(f"⏳ Timeout on attempt {attempt + 1} for {url}. Retrying...")
            except aiohttp.ClientError as e:
                logging.error(f"❌ Request failed: {e}")

        return None

async def crawl_website(url):
    """Crawls the given website and extracts metadata."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()
    page_content = await fetch_page_content(url)

    soup = BeautifulSoup(page_content, "html.parser") if page_content else None
    title = soup.title.string.strip() if soup and soup.title else "No Title"

    cloudinary_url = await capture_screenshot(url, domain)

    return {"url": url, "title": title, "screenshot_url": cloudinary_url}
