from flask import Blueprint, request, jsonify
import asyncio
import os
import time
import joblib
import pandas as pd
from web_crawler.crawler import crawl_website
from ml_analysis.feature_extraction import extract_features

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

    features_df, error = await extract_features(url)
    if error:
        return {"error": "Feature extraction failed", "details": str(error)}

    for feature in FEATURE_ORDER:
        if feature not in features_df.columns:
            features_df[feature] = 0  
    features_df = features_df[FEATURE_ORDER]

    ml_prediction, confidence_score = run_ml_model(features_df)
    crawler_results = await crawl_website(url)

    response = {
        "url": url,
        "crawler_results": crawler_results,
        "ml_response": {"ml_prediction": ml_prediction, "confidence": confidence_score},
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
