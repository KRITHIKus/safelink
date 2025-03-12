import requests
import time
import os
import logging
import asyncio
from dotenv import load_dotenv

# 🔹 Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# 🔹 Load API Key from .env
load_dotenv()
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")

if not VIRUSTOTAL_API_KEY:
    raise ValueError("❌ VirusTotal API Key is missing! Please set it in the .env file.")

# ✅ Async Function to Scan URL using VirusTotal
async def check_virustotal(url):
    """Force a fresh scan of a URL using the VirusTotal API asynchronously."""
    headers = {
        "x-apikey": VIRUSTOTAL_API_KEY,
        "x-force-rescan": "1",  # 🔥 Forces a fresh scan
        "accept": "application/json"
    }

    try:
        # 🔹 Submit URL for a fresh scan
        logging.info(f"🔄 Submitting {url} for a fresh VirusTotal scan.")
        submit_url = "https://www.virustotal.com/api/v3/urls"
        submit_response = requests.post(submit_url, headers=headers, data={"url": url}, timeout=10)

        if submit_response.status_code != 200:
            error_msg = f"❌ VirusTotal submission failed: {submit_response.status_code} {submit_response.text}"
            logging.error(error_msg)
            return {"error": error_msg}

        json_response = submit_response.json()
        scan_id = json_response.get("data", {}).get("id")

        if not scan_id:
            return {"error": "Failed to retrieve scan ID from VirusTotal."}

        #Retrieve fresh scan results (Max wait: 30 seconds)
        result_url = f"https://www.virustotal.com/api/v3/analyses/{scan_id}"
        wait_times = [5, 10, 15]  #Progressive wait strategy
        elapsed_time = 0  

        for wait_time in wait_times:
            await asyncio.sleep(wait_time)
            elapsed_time += wait_time
            logging.info(f"⏳ Checking scan results after {elapsed_time}s...")

            result_response = requests.get(result_url, headers=headers, timeout=10)
            if result_response.status_code == 200:
                result_json = result_response.json()
                attributes = result_json.get("data", {}).get("attributes", {})

                #Ensure attributes exist before accessing
                if not attributes:
                    logging.warning(f"⚠️ No attributes found for {url}. Retrying...")
                    continue

                #Check if scan is completed or still in progress
                scan_status = attributes.get("status", "")
                if scan_status in ["queued", "in-progress"]:
                    logging.info(f"⏳ Scan still in progress for {url}. Retrying...")
                    continue  #Wait for the next retry

                stats = attributes.get("stats", {})
                if not isinstance(stats, dict):
                    stats = {}

                malicious_count = stats.get("malicious", 0)
                total_scans = sum(stats.values()) if stats else 0
                reputation_score = attributes.get("reputation", "Unknown")
                last_scan_timestamp = attributes.get("date", 0)

                last_scan_date = time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(last_scan_timestamp)) if last_scan_timestamp else "Unknown"
                detection_status = "🚨 Malicious" if malicious_count > 0 else "✅ Safe"

                #Process available results
                logging.info(f"✅ Fresh scan complete for {url}. Malicious detections: {malicious_count}/{total_scans}")

                return {
                    "total_scans": total_scans,
                    "malicious_detections": malicious_count,
                    "status": detection_status,
                    "reputation_score": reputation_score,
                    "last_scan_date": last_scan_date,
                    "detected_categories": attributes.get("categories", "Not Available"),
                    "redirected_urls": attributes.get("redirection_chain", [])
                }

        logging.warning(f"⚠️ VirusTotal scan results for {url} not available yet. Try again later.")
        return {"error": "VirusTotal scan results not available yet. Try again later."}

    except requests.RequestException as e:
        logging.error(f"❌ VirusTotal API request failed: {str(e)}")
        return {"error": str(e)}

    except Exception as e:
        logging.error(f"❌ Unexpected error: {str(e)}")
        return {"error": str(e)}
