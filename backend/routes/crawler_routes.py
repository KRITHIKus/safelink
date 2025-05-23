from flask import Blueprint, request, jsonify
import asyncio
import os
import time
import joblib
import pandas as pd
import cloudinary
import cloudinary.uploader
from urllib.parse import urlparse
from web_crawler.crawler import crawl_website
from ml_analysis.feature_extraction import extract_features
from db.db_config import screenshots  # ✅ Import new collection

crawler_bp = Blueprint("crawler", __name__)
@crawler_bp.route("/scan", methods=["POST"])
def crawl():
    """Main route to scan a URL with Crawler and ML model."""
    print("📌 Received request at /scan")
    
    data = request.get_json()
    url = data.get("url")

    if not url:
        print("⚠️ No URL provided in request!")
        return jsonify({"error": "No URL provided"}), 400

    print(f"🔍 Starting scan for URL: {url}")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    response = loop.run_until_complete(run_scan(url))

    print(f"✅ Scan completed for URL: {url}")
    return jsonify(response)

async def run_scan(url):
    """Runs feature extraction, ML model, and web crawler asynchronously."""
    start_time = time.time()
    print(f"🚀 Running scan for {url}...")

    # ✅ Run Web Crawler
    print("🌐 Running web crawler...")
    crawler_results = await crawl_website(url)
    screenshot_path = crawler_results.get("screenshot", None)  # ✅ Fixed key mismatch
    print(f"🖼️ Crawler Screenshot Path: {screenshot_path}")

    # ✅ Upload Screenshot to Cloudinary
    cloudinary_url = None
    if screenshot_path:
        print(f"🔍 Screenshot detected at: {screenshot_path}")  # Debugging log
        cloudinary_url = upload_screenshot(url, screenshot_path)

        # ✅ Store Screenshot in MongoDB if uploaded
        if cloudinary_url:
            website_name = get_website_name(url)
            print(f"💾 Storing screenshot in MongoDB for {website_name}...")
            try:
                result = screenshots.insert_one({
                    "website_name": website_name, 
                    "url": url, 
                    "screenshot_url": cloudinary_url
                })
                print(f"✅ Screenshot URL stored in MongoDB. Inserted ID: {result.inserted_id}")
            except Exception as db_error:
                print(f"❌ Error inserting screenshot into MongoDB: {db_error}")

            crawler_results["screenshot_url"] = cloudinary_url  # ✅ Ensure it's inside crawler_results

    response = {
        "url": url,
        "crawler_results": crawler_results,  # ✅ Contains "title", "description", and "screenshot_url"
        "execution_time": round(time.time() - start_time, 3)
    }

    print(f"🏁 Scan complete for {url}, Execution Time: {response['execution_time']}s")
    return response

def upload_screenshot(url, screenshot_path):
    """Uploads screenshot to Cloudinary and returns the URL."""
    print(f"📤 Attempting to upload screenshot for URL: {url}")

    try:
        # 🔍 Check if file exists before proceeding
        if not os.path.exists(screenshot_path):
            print(f"❌ Screenshot file not found: {screenshot_path}")
            return None

        # Extract website name
        website_name = get_website_name(url)
        unique_id = int(time.time())  # Timestamp for uniqueness
        cloudinary_id = f"{website_name}_{unique_id}"  # Prevent filename collisions

        print(f"✅ Found screenshot. Uploading as {cloudinary_id} to Cloudinary...")

        # Upload to Cloudinary
        response = cloudinary.uploader.upload(
            screenshot_path, public_id=cloudinary_id, unique_filename=True, overwrite=False
        )

        cloudinary_url = response.get("secure_url")
        
        # Check Cloudinary response
        if not cloudinary_url:
            print(f"⚠️ Cloudinary did not return a secure URL. Response: {response}")
            return None

        print(f"✅ Screenshot successfully uploaded to Cloudinary: {cloudinary_url}")
        return cloudinary_url

    except Exception as e:
        print(f"❌ Error uploading to Cloudinary: {str(e)}")
        return None

def get_website_name(url):
    """Extracts the website name from the URL (e.g., amazon.com → amazon)."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    website_name = domain.split('.')[0]  # Extract first part of domain
    print(f"🔤 Extracted website name: {website_name} from {url}")
    return website_name