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

# Load ML Model
model_path = os.path.join(os.path.dirname(__file__), "..", "ml_analysis", "trained_model.pkl")
try:
    model = joblib.load(model_path)
    print("✅ ML model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading ML model: {e}")
    model = None  

FEATURE_ORDER = [
    "PrefixSuffix-", "SubDomains", "HTTPS", "DomainRegLen", "HTTPSDomainURL",
    "RequestURL", "AnchorURL", "ServerFormHandler", "WebsiteTraffic",
    "LinksPointingToPage"
]

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

    # ✅ Extract Features
    print("🔄 Extracting features...")
    features_df, error = await extract_features(url)
    if error:
        print(f"❌ Feature extraction failed: {error}")
        return {"error": "Feature extraction failed", "details": str(error)}

    print(f"✅ Features extracted: {features_df.columns.tolist()}")

    # ✅ Ensure feature order is correct
    for feature in FEATURE_ORDER:
        if feature not in features_df.columns:
            features_df[feature] = 0  
    features_df = features_df[FEATURE_ORDER]

    # ✅ Run ML Model
    print("🤖 Running ML model...")
    ml_prediction, confidence_score = run_ml_model(features_df)
    print(f"✅ ML Prediction: {ml_prediction}, Confidence: {confidence_score}%")

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
            screenshots.insert_one({
                "website_name": website_name, 
                "url": url, 
                "screenshot_url": cloudinary_url
            })
            crawler_results["screenshot_url"] = cloudinary_url  # ✅ Ensure it's inside crawler_results
            print(f"✅ Screenshot URL stored: {cloudinary_url}")

    response = {
        "url": url,
        "crawler_results": crawler_results,  # ✅ Contains "title", "description", and "screenshot_url"
        "ml_response": {"ml_prediction": ml_prediction, "confidence": confidence_score},
        "execution_time": round(time.time() - start_time, 3)
    }

    print(f"🏁 Scan complete for {url}, Execution Time: {response['execution_time']}s")
    return response

def run_ml_model(features_df):
    """Runs ML Model on extracted features."""
    print("🔍 Running ML Model...")
    
    if model is None:
        print("❌ ML model not loaded!")
        return "Error: ML model not loaded", 0.0

    try:
        prediction = model.predict(features_df)[0]
        probabilities = model.predict_proba(features_df)[0]
        confidence = max(probabilities)
        print(f"✅ ML Model Prediction: {prediction}, Confidence Score: {confidence * 100:.2f}%")
        return ("Malicious" if prediction == 1 else "Safe"), round(confidence * 100, 2)
    except Exception as e:
        print(f"❌ Error in ML model prediction: {e}")
        return f"Error: ML model prediction failed: {str(e)}", 0.0

def upload_screenshot(url, screenshot_path):
    """Uploads screenshot to Cloudinary and returns the URL."""
    print(f"📤 Uploading screenshot for {url}...")

    try:
        if not os.path.exists(screenshot_path):
            print(f"❌ Screenshot file does not exist: {screenshot_path}")
            return None

        website_name = get_website_name(url)  
        unique_id = int(time.time())  # Get current timestamp
        cloudinary_id = f"{website_name}_{unique_id}"  # Append timestamp to prevent overwriting

        print(f"✅ Uploading {screenshot_path} to Cloudinary as {cloudinary_id}...")

        response = cloudinary.uploader.upload(
            screenshot_path, public_id=cloudinary_id, unique_filename=True, overwrite=False
        )

        cloudinary_url = response.get("secure_url")

        if cloudinary_url:
            print(f"✅ Uploaded successfully: {cloudinary_url}")
        else:
            print(f"⚠️ Cloudinary response did not contain a URL: {response}")

        return cloudinary_url

    except Exception as e:
        print(f"❌ Error uploading to Cloudinary: {e}")
        return None

def get_website_name(url):
    """Extracts the website name from the URL (e.g., amazon.com → amazon)."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    website_name = domain.split('.')[0]  # Extract first part of domain
    print(f"🔤 Extracted website name: {website_name} from {url}")
    return website_name
