from flask import Blueprint, request, jsonify
from datetime import datetime
from db.db_config import safe_urls, phishing_urls, screenshots  # ✅ Import new collection

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
    status = request.args.get("status")  
    date_str = request.args.get("date")

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

    return jsonify({"error": "Invalid status. Use 'safe' or 'malicious'."}), 400

@db_bp.route("/get-screenshot", methods=["GET"])
def get_screenshot():
    """Fetch screenshot URL for a specific website."""
    url = request.args.get("url")
    if not url:
        return jsonify({"error": "Provide 'url' parameter"}), 400

    result = screenshots.find_one({"url": url}, {"_id": 0})
    if result:
        return jsonify(result)
    else:
        return jsonify({"message": "No screenshot found for this URL"}), 404
