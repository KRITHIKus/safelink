import threading
import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from third_party.virustotal_api import check_virustotal
from db.db_config import safe_urls, phishing_urls

logger = logging.getLogger(__name__)

virustotal_bp = Blueprint("virustotal", __name__)

# ── Cache TTL (must match crawler_routes) ────────────────────────────────────
CACHE_TTL_HOURS = 24

# ── Malicious status string (must match what check_virustotal returns) ────────
MALICIOUS_STATUS = "🚨 Malicious"


# ─────────────────────────────────────────────────────────────────────────────
# Cache helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_cached_vt(url: str) -> dict | None:
    """
    Return a recent VirusTotal result from MongoDB if one exists within TTL.
    Saves the VT API call, DB write, and response time on repeat scans.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS)

    for collection in (safe_urls, phishing_urls):
        try:
            doc = collection.find_one(
                {
                    "url": url,
                    "timestamp": {"$gte": cutoff},
                    "virustotal_results": {"$exists": True},
                },
                {"_id": 0, "virustotal_results": 1},
            )
            if doc and doc.get("virustotal_results"):
                logger.info(f"[CACHE] VT hit for {url}")
                return doc["virustotal_results"]
        except Exception as e:
            logger.warning(f"[CACHE] VT DB lookup failed: {e}")

    logger.info(f"[CACHE] VT miss for {url}")
    return None


def _store_vt_result_bg(url: str, vt_results: dict) -> None:
    """
    Write VT result to MongoDB in a background thread.
    The HTTP response is returned before this function starts,
    so the client never waits for the DB write.

    Key change vs original:
    - Was: awaited inside the async route (blocking the response)
    - Now: daemon thread, fire-and-forget (saves 200-500ms per scan)
    """
    if not vt_results or "status" not in vt_results:
        logger.warning(f"[DB] Skipping store — no valid VT results for {url}")
        return

    collection = phishing_urls if vt_results.get("status") == MALICIOUS_STATUS else safe_urls

    scan_data = {
        "url":               url,
        "virustotal_results": vt_results,
        "timestamp":         datetime.now(timezone.utc),
    }

    try:
        existing = collection.find_one({"url": url}, {"_id": 1})
        if existing:
            collection.update_one({"url": url}, {"$set": scan_data})
            logger.info(f"[DB] Updated VT record for {url}")
        else:
            collection.insert_one(scan_data)
            logger.info(f"[DB] Inserted VT record for {url}")
    except Exception as e:
        logger.error(f"[DB] VT store failed for {url}: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Route
# ─────────────────────────────────────────────────────────────────────────────

@virustotal_bp.route("/virustotal_scan", methods=["POST"])
def virustotal_scan():
    """
    POST /virustotal/virustotal_scan
    Body: { "url": "https://example.com" }

    Key changes vs original:
    1. Fixed:  Was `async def` on a plain Flask app — Flask without flask[async]
               does not support async route handlers. The awaits were running
               in an undefined state. Now a regular sync function using
               asyncio.run() to call check_virustotal if it is a coroutine,
               or calling it directly if it returns a value synchronously.
    2. Added:  24-hour MongoDB cache check before calling VT API
    3. Fixed:  DB write moved to daemon thread (off critical path)
    4. Kept:   Identical JSON response shape — frontend receives same fields
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    force_refresh = data.get("force_refresh", False)

    logger.info(f"[VT] Scan request for {url}")

    # ── Cache check ────────────────────────────────────────────────────────────
    if not force_refresh:
        cached = _get_cached_vt(url)
        if cached:
            return jsonify(cached)

    # ── Call VirusTotal API ────────────────────────────────────────────────────
    try:
        import asyncio, inspect

        # check_virustotal may be async or sync depending on implementation.
        # Handle both cases safely.
        if inspect.iscoroutinefunction(check_virustotal):
            vt_results = asyncio.run(check_virustotal(url))
        else:
            vt_results = check_virustotal(url)

    except Exception as e:
        logger.error(f"[VT] API call failed for {url}: {e}")
        return jsonify({"error": f"VirusTotal scan failed: {str(e)}"}), 500

    if not vt_results:
        logger.error(f"[VT] Empty result for {url}")
        return jsonify({"error": "VirusTotal returned empty result"}), 500

    logger.info(f"[VT] Scan complete for {url}: {vt_results.get('status', 'unknown')}")

    # ── Background DB write (off critical path) ────────────────────────────────
    threading.Thread(
        target=_store_vt_result_bg,
        args=(url, vt_results),
        daemon=True,
    ).start()

    # Return immediately — client does not wait for DB write
    return jsonify(vt_results)