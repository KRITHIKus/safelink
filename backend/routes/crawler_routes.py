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
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    response = loop.run_until_complete(run_scan(url))

    return jsonify(response)

async def run_scan(url):
    """Runs feature extraction, ML model, and web crawler asynchronously."""
    start_time = time.time()

    # ✅ Extract Features
    features_df, error = await extract_features(url)
    if error:
        return {"error": "Feature extraction failed", "details": str(error)}

    # ✅ Ensure feature order is correct
    for feature in FEATURE_ORDER:
        if feature not in features_df.columns:
            features_df[feature] = 0  
    features_df = features_df[FEATURE_ORDER]

    # ✅ Run ML Model
    ml_prediction, confidence_score = run_ml_model(features_df)

    # ✅ Run Web Crawler
    crawler_results, screenshot_path = await crawl_website(url)  

    # ✅ Upload Screenshot to Cloudinary
    cloudinary_url = None
    if screenshot_path:
        cloudinary_url = upload_screenshot(url, screenshot_path)

        # ✅ Store Screenshot in MongoDB if uploaded
        if cloudinary_url:
            website_name = get_website_name(url)
            screenshots.insert_one({
                "website_name": website_name, 
                "url": url, 
                "screenshot_url": cloudinary_url
            })

    response = {
        "url": url,
        "crawler_results": crawler_results,  # ✅ Contains "title" & "description"
        "ml_response": {"ml_prediction": ml_prediction, "confidence": confidence_score},
        "screenshot_url": cloudinary_url,  # ✅ Cloudinary screenshot URL
        "execution_time": round(time.time() - start_time, 3)
    }

    return response

def run_ml_model(features_df):
    """Runs ML Model on extracted features."""
    if model is None:
        return "Error: ML model not loaded", 0.0

    try:
        prediction = model.predict(features_df)[0]
        probabilities = model.predict_proba(features_df)[0]
        confidence = max(probabilities)
        return ("Malicious" if prediction == 1 else "Safe"), round(confidence * 100, 2)
    except Exception as e:
        return f"Error: ML model prediction failed: {str(e)}", 0.0

def upload_screenshot(url, screenshot_path):
    """Uploads screenshot to Cloudinary and returns the URL."""
    try:
        website_name = get_website_name(url)  # ✅ Extract website name from URL
        response = cloudinary.uploader.upload(screenshot_path, public_id=website_name, unique_filename=False, overwrite=True)
        return response.get("secure_url")
    except Exception as e:
        print(f"❌ Error uploading to Cloudinary: {e}")
        return None

def get_website_name(url):
    """Extracts the website name from the URL (e.g., amazon.com → amazon)."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    website_name = domain.split('.')[0]  # Extract first part of domain
    return website_name
