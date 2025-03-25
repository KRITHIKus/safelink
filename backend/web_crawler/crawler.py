import asyncio
import aiohttp
import random
import time  # ✅ Import time for timestamps
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import cloudinary.uploader  # ✅ Cloudinary for screenshot upload
import logging  # ✅ Added logging for debugging
import os  # ✅ Import os for environment variables

# ✅ Configure logging for debugging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# ✅ Use headless Chrome instead of local ChromeDriver.exe
def setup_driver():
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

    # ✅ Get Chrome & ChromeDriver paths from environment variables
    chrome_binary = os.getenv("CHROME_BINARY", "/opt/render/chrome/chrome/chrome")
    chromedriver_binary = os.getenv("CHROMEDRIVER_BINARY", "/opt/render/chrome/chromedriver/chromedriver")

    # ✅ Ensure binaries exist before proceeding
    if not os.path.exists(chrome_binary):
        logging.error(f"❌ ERROR: Chrome binary not found at {chrome_binary}")
        return None
    if not os.path.exists(chromedriver_binary):
        logging.error(f"❌ ERROR: ChromeDriver binary not found at {chromedriver_binary}")
        return None

    os.chmod(chromedriver_binary, 0o755)  # ✅ Ensure ChromeDriver is executable

    chrome_options.binary_location = chrome_binary

    try:
        service = Service(chromedriver_binary)
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

            screenshot_data = driver.get_screenshot_as_png()  # ✅ Capture screenshot as bytes
            cloudinary_id = f"{domain}_{int(time.time())}"  # ✅ Unique ID based on timestamp

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
            driver.quit()  # ✅ Close the browser session

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
                logging.error(f"❌ Request failed on attempt {attempt + 1} for {url}: {e}")

        logging.error(f"🚫 Failed to fetch {url} after {retries} retries.")
        return None

async def crawl_website(url):
    """Crawls the given website and extracts title, description, and uploads a screenshot to Cloudinary."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()

    page_content = await fetch_page_content(url)
    if not page_content:
        logging.error(f"⏳ Timeout: {url} took too long to respond.")
        return {"error": "Failed to fetch page content.", "url": url, "screenshot_url": None}

    soup = BeautifulSoup(page_content, "html.parser")
    title = soup.title.string.strip() if soup.title and soup.title.string else "No Title"
    description = soup.find("meta", attrs={"name": "description"})
    description = description["content"].strip() if description and description.has_attr("content") else "No Description"

    cloudinary_url = await capture_screenshot(url, domain)  # ✅ Upload screenshot directly

    return {
        "url": url,
        "title": title,
        "description": description,
        "screenshot_url": cloudinary_url  # ✅ Cloudinary screenshot URL
    }
