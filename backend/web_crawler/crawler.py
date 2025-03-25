import asyncio
import aiohttp
import random
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import cloudinary.uploader  # ✅ Added Cloudinary upload
import time  # ✅ Fix: Import time module


# Set path to your local ChromeDriver executable
CHROME_DRIVER_PATH = "chromedriver.exe"

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0 Safari/537.36"
]

async def capture_screenshot(url, domain):
    """Captures a screenshot and uploads it to Cloudinary."""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")  
    chrome_options.add_argument("--no-sandbox")   
    chrome_options.add_argument("--disable-dev-shm-usage")  

    def selenium_task():
        driver = None
        try:
            service = Service(CHROME_DRIVER_PATH)  
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.get(url)
            screenshot_data = driver.get_screenshot_as_png()  # ✅ Capture screenshot as bytes

            # ✅ Upload directly to Cloudinary
            cloudinary_id = f"{domain}_{int(time.time())}"  
            response = cloudinary.uploader.upload(screenshot_data, public_id=cloudinary_id, overwrite=False)

            return response.get("secure_url")  # ✅ Return Cloudinary URL
        except Exception as e:
            print(f"❌ Screenshot capture failed: {e}")
            return None
        finally:
            if driver:
                driver.quit()

    return await asyncio.to_thread(selenium_task)

async def fetch_page_content(url, retries=3):
    """Fetches the HTML content of a webpage asynchronously with retry logic."""
    headers = {"User-Agent": random.choice(USER_AGENTS)}
    async with aiohttp.ClientSession() as session:
        for attempt in range(retries):
            try:
                async with session.get(url, headers=headers, timeout=15) as response:
                    if response.status == 200:
                        return await response.text()
                    print(f"⚠️ Attempt {attempt + 1} failed for {url}. Retrying...")
            except asyncio.TimeoutError:
                print(f"⏳ Timeout on attempt {attempt + 1} for {url}. Retrying...")
            except aiohttp.ClientError:
                print(f"❌ Request failed on attempt {attempt + 1} for {url}. Retrying...")

        print(f"🚫 Failed to fetch {url} after {retries} retries.")
        return None

async def crawl_website(url):
    """Crawls the given website and extracts title, description, and uploads a screenshot to Cloudinary."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()

    page_content = await fetch_page_content(url)
    if not page_content:
        print(f"⏳ Timeout: {url} took too long to respond.")
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
