from pymongo import MongoClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")  
DB_NAME = "SafeSurfDB"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

safe_urls = db["safe_urls"]
phishing_urls = db["phishing_urls"]
screenshots = db["screenshots"]  # ✅ New collection for storing screenshots

print("✅ MongoDB connected successfully!")
