import asyncio
import aiohttp
import os
import time
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

#Set path to your local ChromeDriver executable
CHROME_DRIVER_PATH = os.path.join(os.getcwd(), "chromedriver.exe")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/91.0 Safari/537.36"
]

async def capture_screenshot(url, domain):
    screenshot_path = f"screenshots/{domain}.png"
    os.makedirs("screenshots", exist_ok=True)

    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")  #Faster rendering
    chrome_options.add_argument("--no-sandbox")   #Improve startup speed
    chrome_options.add_argument("--disable-dev-shm-usage")  #Avoid crashes

    def selenium_task():
        driver = None
        try:
            service = Service(CHROME_DRIVER_PATH)  #Use local ChromeDriver
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.get(url)
            driver.save_screenshot(screenshot_path)
            return screenshot_path
        finally:
            if driver:
                driver.quit()

    return await asyncio.to_thread(selenium_task)

async def fetch_page_content(url):
    headers = {"User-Agent": USER_AGENTS[int(time.time()) % len(USER_AGENTS)]}
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=headers, timeout=5) as response:  #Faster timeout (5s)
                return await response.text() if response.status == 200 else None
        except aiohttp.ClientError:
            return None

async def crawl_website(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()

    page_content = await fetch_page_content(url)
    if not page_content:
        return {"error": "Failed to fetch page content."}

    soup = BeautifulSoup(page_content, "html.parser")
    title = soup.title.string.strip() if soup.title and soup.title.string else "No Title"
    description = soup.find("meta", attrs={"name": "description"})
    description = description["content"].strip() if description and description.has_attr("content") else "No Description"

    screenshot_path = await capture_screenshot(url, domain)

    return {
        "url": url,
        "title": title,
        "description": description,
        "screenshot": screenshot_path or "Failed to capture"
    }
