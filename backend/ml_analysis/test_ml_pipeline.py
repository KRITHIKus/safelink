import sys
import os
import joblib
import pandas as pd
from ml_analysis.feature_extraction import extract_features

#Add backend directory to Python's module search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

#Define the path to the trained model
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(backend_dir, "ml_analysis", "trained_model.pkl")

#Load the ML Model
try:
    model = joblib.load(model_path)
    print("✅ ML model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading ML model: {e}")
    model = None

#Define a test URL
test_url = "https://in.bookmyshow.com/"

#Extract features for the test URL
try:
    features_df, error = extract_features(test_url)
    if error:
        print(f"❌ Feature extraction failed: {error}")
        sys.exit(1)  #Exit the script with an error code
except Exception as e:
    print(f"❌ Feature extraction crashed: {e}")
    sys.exit(1)

#Required feature order (Ensure Correct Input for the ML Model)
feature_order = [
    "PrefixSuffix-", "SubDomains", "HTTPS", "HTTPSDomainURL", 
    "RequestURL", "AnchorURL", "ServerFormHandler", 
    "WebsiteTraffic", "LinksPointingToPage", "DomainRegLen"
]

#Validate Features
missing_features = list(set(feature_order) - set(features_df.columns))
extra_features = list(set(features_df.columns) - set(feature_order))

if missing_features or extra_features:
    print(f"❌ Feature mismatch! Missing: {missing_features}, Extra: {extra_features}")
    sys.exit(1)

#Convert Features to Numeric Type
features_df = features_df[feature_order].astype(float)

#Make Prediction Using ML Model
if model is None:
    print("❌ ML model not loaded, cannot proceed with prediction.")
    sys.exit(1)

try:
    prediction = model.predict(features_df)[0]
    probabilities = model.predict_proba(features_df)[0]
    confidence_score = round(max(probabilities), 2)
    ml_prediction = "Phishing" if prediction == 1 else "Safe"

    #Extract Feature Importance (If Available)
    try:
        feature_importances = model.feature_importances_
        importance_scores = {feature_order[i]: round(feature_importances[i], 4) for i in range(len(feature_order))}
    except AttributeError:
        importance_scores = "Not available"

    print("\n✅ **Prediction Results:**")
    print(f"🔹 URL: {test_url}")
    print(f"🔹 ML Prediction: {ml_prediction}")
    print(f"🔹 Confidence Score: {confidence_score}")
    print(f"🔹 Feature Importance: {importance_scores}")

except Exception as e:
    print(f"❌ Prediction failed: {e}")
    sys.exit(1)
