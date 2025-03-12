import joblib
import pandas as pd
import os
import asyncio  
from ml_analysis.feature_extraction import extract_features  


backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(backend_dir, "ml_analysis", "trained_model.pkl")
scaler_path = os.path.join(backend_dir, "ml_analysis", "scaler.pkl")


model = joblib.load(model_path)
scaler = joblib.load(scaler_path)


feature_order = ["PrefixSuffix-", "SubDomains", "HTTPS", "DomainRegLen", "HTTPSDomainURL",
                 "RequestURL", "AnchorURL", "ServerFormHandler", "WebsiteTraffic", "LinksPointingToPage"]

async def async_predict_url(url):
    """ Asynchronous function to extract features, scale them, and predict using the model """
    print(f"🔍 Testing URL: {url}")

    
    features_df, error = await extract_features(url)
    
    if error:
        return {"error": error}

    
    features_scaled = scaler.transform(features_df)

    prediction = model.predict(features_scaled)[0]  
    confidence = model.predict_proba(features_scaled)[0][prediction]  

    return {
        "URL": url,
        "Prediction": "Phishing" if prediction == 1 else "Safe",
        "Confidence Score": round(confidence, 2),
    }

def predict_url(url):
    """ Wrapper function to run async function inside a synchronous environment """
    return asyncio.run(async_predict_url(url))  


if __name__ == "__main__":
    test_url = "https://www.infosys.com/"  
    result = predict_url(test_url)
    print("🛡️ Detection Result:", result)
