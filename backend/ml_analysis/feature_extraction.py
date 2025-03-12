import os
import joblib
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime
import asyncio
import aiohttp
import re
import tldextract
import whois


load_dotenv()
OPENPAGERANK_API_KEY = os.getenv("OPENPAGERANK_API_KEY")


script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)

model_path = os.path.join(backend_dir, "ml_analysis", "trained_model.pkl")
scaler_path = os.path.join(backend_dir, "ml_analysis", "scaler.pkl")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)


async def async_whois(domain):
    """Fetches WHOIS details asynchronously."""
    try:
        loop = asyncio.get_running_loop()
        domain_info = await loop.run_in_executor(None, whois.whois, domain)
        
        if domain_info:
            creation_date = domain_info.creation_date
            expiration_date = domain_info.expiration_date

            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            if isinstance(expiration_date, list):
                expiration_date = expiration_date[0]

            if isinstance(creation_date, datetime) and isinstance(expiration_date, datetime):
                return (expiration_date - creation_date).days
    except Exception:
        return 0  
    return 0

async def fetch_page_content(url, session):
    """Fetches webpage content asynchronously."""
    try:
        async with session.get(url, timeout=7, headers={"User-Agent": "Mozilla/5.0"}) as response:
            return await response.text() if response.status == 200 else ""
    except aiohttp.ClientError:
        return ""

async def get_website_traffic(domain, session):
    """Fetches website traffic data from OpenPageRank API."""
    try:
        async with session.get(
            f"https://openpagerank.com/api/v1.0/getPageRank?domains[]={domain}",
            headers={"API-OPR": OPENPAGERANK_API_KEY}, timeout=5
        ) as resp:
            data = await resp.json()
            if data.get("response"):
                return data["response"][0].get("page_rank_integer", 0)
    except Exception:
        return 0
    return 0

async def extract_features(url):
    """Extracts relevant features for ML model."""
    features = {}
    features["HTTPS"] = 1 if url.startswith("https") else 0

    extracted = tldextract.extract(url)
    domain = f"{extracted.domain}.{extracted.suffix}"
    features["SubDomains"] = extracted.subdomain.count('.') + 1 if extracted.subdomain else 0
    features["PrefixSuffix-"] = 1 if '-' in extracted.domain else 0
    features["HTTPSDomainURL"] = 1 if "https" in domain else 0

    async with aiohttp.ClientSession() as session:
        whois_task = asyncio.create_task(async_whois(domain))
        page_task = asyncio.create_task(fetch_page_content(url, session))
        traffic_task = asyncio.create_task(get_website_traffic(domain, session))

        domain_reg_length, page_content, website_traffic = await asyncio.gather(
            whois_task, page_task, traffic_task
        )

    features["DomainRegLen"] = domain_reg_length
    features["WebsiteTraffic"] = website_traffic
    features["RequestURL"] = len(re.findall(r'src=["\'](https?://.*?)[ "\']', page_content))
    features["AnchorURL"] = len(re.findall(r'href=["\'](https?://.*?)[ "\']', page_content))
    features["ServerFormHandler"] = 1 if "<form" in page_content else 0
    features["LinksPointingToPage"] = page_content.count("<a href")

    feature_order = ["PrefixSuffix-", "SubDomains", "HTTPS", "DomainRegLen", "HTTPSDomainURL",
                     "RequestURL", "AnchorURL", "ServerFormHandler", "WebsiteTraffic", "LinksPointingToPage"]

    features_df = pd.DataFrame([[features.get(feat, 0) for feat in feature_order]], columns=feature_order)

    return features_df, None  

def run_ml_model(features_df):
    """Runs ML model for prediction."""
    try:
        features_scaled = scaler.transform(features_df)
        prediction = model.predict(features_scaled)[0]
        confidence = max(model.predict_proba(features_scaled)[0])

        return ("Malicious" if prediction == 1 else "Safe"), round(confidence * 100, 2)
    except Exception as e:
        return f"Error: {str(e)}", 0.0
