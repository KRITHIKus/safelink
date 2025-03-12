from flask import Blueprint, request, jsonify
from datetime import datetime
from db.db_config import safe_urls, phishing_urls

db_bp = Blueprint("db_routes", __name__)

@db_bp.route("/get-scanned-url", methods=["GET"])  
def get_scanned_url():
    """Fetch stored VirusTotal scan results for a specific URL."""
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "Provide 'url' parameter"}), 400

    #Search in both collections
    result = safe_urls.find_one({"url": url}, {"_id": 0}) or phishing_urls.find_one({"url": url}, {"_id": 0})

    if result:
        print(f"✅ Fetched URL from DB: {url}")
        return jsonify(result)
    else:
        print(f"⚠️ URL not found in DB: {url}")
        return jsonify({"message": "URL not found in database"}), 404

@db_bp.route("/get-urls-by-status", methods=["GET"])
def get_urls_by_status():
    """Fetch URLs by status (Safe or Malicious) with optional date filter."""
    status = request.args.get("status")  # 'safe' or 'malicious'
    date_str = request.args.get("date")  # YYYY-MM-DD format

    #If no status is provided, return all URLs from both collections
    if not status:
        query = {}
        if date_str:
            try:
                date = datetime.strptime(date_str, "%Y-%m-%d")
                query["timestamp"] = {"$gte": date, "$lt": date.replace(hour=23, minute=59, second=59)}
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        safe_data = list(safe_urls.find(query, {"_id": 0}))
        malicious_data = list(phishing_urls.find(query, {"_id": 0}))
        all_urls = safe_data + malicious_data

        return jsonify(all_urls if all_urls else {"message": "No URLs found for the given filters"}), 200

    #Determine the correct collection based on status
    if status.lower() == "safe":
        collection = safe_urls
    elif status.lower() == "malicious":
        collection = phishing_urls
    else:
        return jsonify({"error": "Invalid status. Use 'safe' or 'malicious'."}), 400

    #Apply optional date filter
    query = {}
    if date_str:
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d")
            query["timestamp"] = {"$gte": date, "$lt": date.replace(hour=23, minute=59, second=59)}
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    urls = list(collection.find(query, {"_id": 0}))

    return jsonify(urls if urls else {"message": "No URLs found for the given filters"}), 200
