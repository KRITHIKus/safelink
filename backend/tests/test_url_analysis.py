import os
import requests
import joblib
import pandas as pd
import asyncio
from ml_analysis.feature_extraction import extract_features  # ✅ Import feature extraction
from third_party.virustotal_api import check_virustotal  # ✅ Import VirusTotal API function
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

# ✅ Load ML Model & Scaler
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(backend_dir, "ml_analysis", "trained_model.pkl")
scaler_path = os.path.join(backend_dir, "ml_analysis", "scaler.pkl")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)

# ✅ Define Correct Feature Order
feature_order = ["PrefixSuffix-", "SubDomains", "HTTPS", "DomainRegLen", "HTTPSDomainURL",
                 "RequestURL", "AnchorURL", "ServerFormHandler", "WebsiteTraffic", "LinksPointingToPage"]


### 🔍 **ML Model Prediction**
async def predict_url(url):
    """ Extract features, scale them, and predict using ML model """
    
    features_df, error = await extract_features(url)
    if error:
        return {"error": error}

    # ✅ Scale Features
    features_scaled = scaler.transform(features_df)

    # ✅ Predict using ML model
    prediction = model.predict(features_scaled)[0]  # 0 = Safe, 1 = Phishing
    confidence = model.predict_proba(features_scaled)[0][prediction]  # Confidence score

    return {
        "URL": url,
        "ML_Prediction": "Phishing" if prediction == 1 else "Safe",
        "Confidence_Score": round(float(confidence), 4)  # ✅ Rounded for clarity
    }


### 🚀 **Run Full Analysis**
async def analyze_url(url):
    """ Run both ML prediction and VirusTotal check asynchronously """
    
    # ✅ Run ML Model & VirusTotal check in parallel
    ml_task = asyncio.create_task(predict_url(url))
    vt_task = asyncio.create_task(check_virustotal(url))  # ✅ Await directly

    ml_result, vt_result = await asyncio.gather(ml_task, vt_task)

    # ✅ Extract Key VirusTotal Data
    vt_summary = {
        "VT_Status": vt_result.get("status", "Unknown"),
        "VT_Malicious_Detections": vt_result.get("malicious_detections", 0),
        "VT_Total_Scans": vt_result.get("total_scans", 0),
        "VT_Reputation_Score": vt_result.get("reputation_score", "Unknown"),
    }

    # ✅ Final Result
    final_result = {**ml_result, **vt_summary}

    # ✅ Print Only Required Information
    print("\n🔍 **Final Analysis:**")
    print(f"🛡️ URL: {final_result['URL']}")
    print(f"🤖 ML Prediction: {final_result['ML_Prediction']} (Confidence: {final_result['Confidence_Score']})")
    print(f"🦠 VirusTotal Status: {final_result['VT_Status']}")
    print(f"🚨 VT Malicious Detections: {final_result['VT_Malicious_Detections']}/{final_result['VT_Total_Scans']}")
    print(f"📊 VT Reputation Score: {final_result['VT_Reputation_Score']}")

    return final_result


### 🔥 **Main Execution**
if __name__ == "__main__":
    test_url = "https://chaingefinancetoken.pages.dev"  # 🔹 Replace with any URL you want to test
    asyncio.run(analyze_url(test_url))
