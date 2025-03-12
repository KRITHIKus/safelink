import asyncio
from flask import Blueprint, request, jsonify
from datetime import datetime
from third_party.virustotal_api import check_virustotal
from db.db_config import safe_urls, phishing_urls

virustotal_bp = Blueprint("virustotal", __name__)

@virustotal_bp.route("/virustotal_scan", methods=["POST"])
async def virustotal_scan():
    """Handles VirusTotal scan separately and stores results in DB."""
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    print(f"🔄 Running VirusTotal scan for: {url}")

    try:
        #Fix: Await the async function
        virustotal_results = await check_virustotal(url)

        if virustotal_results:
            print(f"✅ VirusTotal scan completed: {virustotal_results}")
            await store_results_in_db(url, virustotal_results)  # ✅ Also await here
            return jsonify(virustotal_results)
        else:
            return jsonify({"error": "VirusTotal scan failed"}), 500

    except Exception as e:
        print(f"❌ VirusTotal scan error: {str(e)}")
        return jsonify({"error": str(e)}), 500

async def store_results_in_db(url, virustotal_results):
    """Stores VirusTotal scan results in MongoDB."""
    if not virustotal_results or "status" not in virustotal_results:
        print(f"⚠️ No valid API results for {url}, skipping DB insert.")
        return

    #Select the correct collection based on VirusTotal's status
    collection = phishing_urls if virustotal_results["status"] == "🚨 Malicious" else safe_urls

    scan_data = {
        "url": url,
        "virustotal_results": virustotal_results,
        "timestamp": datetime.utcnow()
    }

    try:
        existing_entry = await asyncio.to_thread(collection.find_one, {"url": url})
        if existing_entry:
            print(f"🔄 Updating existing entry for {url}")
            await asyncio.to_thread(collection.update_one, {"url": url}, {"$set": scan_data})
        else:
            print(f"✅ Inserting new entry for {url}")
            await asyncio.to_thread(collection.insert_one, scan_data)

    except Exception as e:
        print(f"❌ Database error while storing {url}: {str(e)}")
