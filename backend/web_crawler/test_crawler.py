import asyncio
import os
from web_crawler.crawler import crawl_website  

SCREENSHOT_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "screenshots")

async def test_crawler():
    test_url = "https://sunpass.com-xaaaqj.vip/"
    result = await crawl_website(test_url)

    print("\n🔍 **Crawler Test Result:**")
    print(f"🌐 URL: {result.get('url', 'N/A')}")
    print(f"📌 Title: {result.get('title', 'N/A')}")
    print(f"📝 Description: {result.get('description', 'N/A')}")


    screenshot_path = result.get("screenshot")
    if screenshot_path:
        abs_screenshot_path = os.path.join(SCREENSHOT_FOLDER, os.path.basename(screenshot_path))
        if os.path.exists(abs_screenshot_path):
            print(f"📷 Screenshot saved at: {abs_screenshot_path}")
        else:
            print("⚠️ Screenshot capture failed or file not found.")
    else:
        print("⚠️ No screenshot was generated.")

if __name__ == "__main__":
    asyncio.run(test_crawler())
