import asyncio
import time
import threading
import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse
from flask import Blueprint, request, jsonify
from web_crawler.crawler import crawl_website
from db.db_config import screenshots, safe_urls, phishing_urls

logger = logging.getLogger(__name__)

crawler_bp = Blueprint("crawler", __name__)

# ── Cache TTL ──────────────────────────────────────────────────────────────────
# URLs scanned within this window are served from MongoDB — no Chrome launch
CACHE_TTL_HOURS = 24


# ─────────────────────────────────────────────────────────────────────────────
# Cache helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_cached_result(url: str) -> dict | None:
    """
    Look for a recent crawler result in MongoDB.
    Checks both safe_urls and phishing_urls for an entry with a cached
    crawler_results block that is less than CACHE_TTL_HOURS old.

    This is the single biggest performance win:
    - Cache hit  → response in < 200ms (no Chrome, no Cloudinary)
    - Cache miss → full pipeline runs as before
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS)

    for collection in (safe_urls, phishing_urls):
        try:
            doc = collection.find_one(
                {
                    "url": url,
                    "timestamp": {"$gte": cutoff},
                    "crawler_results": {"$exists": True},
                },
                {"_id": 0, "crawler_results": 1, "timestamp": 1},
            )
            if doc and doc.get("crawler_results"):
                logger.info(f"[CACHE] Hit for {url}")
                return doc["crawler_results"]
        except Exception as e:
            logger.warning(f"[CACHE] DB lookup failed: {e}")

    logger.info(f"[CACHE] Miss for {url} — running full crawl")
    return None


def _store_screenshot_bg(url: str, screenshot_url: str) -> None:
    """
    Store the screenshot reference in MongoDB in a background thread.
    Called with threading.Thread(daemon=True) so it never blocks the response.
    """
    try:
        website_name = _extract_domain(url)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_TTL_HOURS)

        existing = screenshots.find_one(
            {"url": url, "timestamp": {"$gte": cutoff}},
            {"_id": 1},
        )

        if existing:
            screenshots.update_one(
                {"url": url},
                {"$set": {
                    "screenshot_url": screenshot_url,
                    "timestamp": datetime.now(timezone.utc),
                }},
            )
            logger.info(f"[DB] Updated screenshot for {website_name}")
        else:
            screenshots.insert_one({
                "website_name": website_name,
                "url": url,
                "screenshot_url": screenshot_url,
                "timestamp": datetime.now(timezone.utc),
            })
            logger.info(f"[DB] Inserted screenshot for {website_name}")

    except Exception as e:
        logger.error(f"[DB] Screenshot store failed for {url}: {e}")


def _update_cached_crawler_results(url: str, crawler_results: dict) -> None:
    """
    Persist crawler_results into whichever collection already holds this URL.
    Runs in a background thread — never blocks the HTTP response.
    """
    try:
        for collection in (safe_urls, phishing_urls):
            doc = collection.find_one({"url": url}, {"_id": 1})
            if doc:
                collection.update_one(
                    {"url": url},
                    {"$set": {"crawler_results": crawler_results}},
                )
                logger.info(f"[DB] crawler_results cached for {url}")
                return
        # URL not in either collection yet — it will be written by virustotal_routes
        # when VT scan completes. Nothing to do here.
    except Exception as e:
        logger.error(f"[DB] Failed to cache crawler_results for {url}: {e}")


def _extract_domain(url: str) -> str:
    """Return the first label of the hostname, e.g. https://amazon.com → amazon"""
    try:
        return urlparse(url).netloc.split(".")[0]
    except Exception:
        return "unknown"


# ─────────────────────────────────────────────────────────────────────────────
# Route
# ─────────────────────────────────────────────────────────────────────────────

@crawler_bp.route("/scan", methods=["POST"])
def crawl():
    """
    POST /crawler/scan
    Body: { "url": "https://example.com" }

    Key changes vs original:
    1. Removed: import joblib, pandas, ml_analysis — dead ML code
    2. Fixed:   asyncio.new_event_loop() per request → asyncio.run()
                (new_event_loop was expensive and not thread-safe)
    3. Added:   24-hour MongoDB cache check before launching Chrome
    4. Fixed:   Removed dead upload_screenshot() that caused double Cloudinary upload
    5. Fixed:   DB screenshot write moved to daemon thread (off critical path)
    6. Added:   crawler_results persisted to existing scan record for future cache hits
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    force_refresh = data.get("force_refresh", False)  # optional override

    logger.info(f"[SCAN] Request received for {url}")

    # ── Cache check ────────────────────────────────────────────────────────────
    if not force_refresh:
        cached = _get_cached_result(url)
        if cached:
            return jsonify({
                "url": url,
                "crawler_results": cached,
                "cached": True,
                "execution_time": 0,
            })

    # ── Full crawl ─────────────────────────────────────────────────────────────
    start = time.time()

    try:
        # asyncio.run() is the correct modern pattern.
        # It creates a fresh event loop, runs the coroutine to completion,
        # then closes the loop cleanly. Thread-safe under Gunicorn gthread workers.
        crawler_results = asyncio.run(crawl_website(url))
    except Exception as e:
        logger.error(f"[SCAN] crawl_website raised: {e}")
        return jsonify({"error": "Crawler failed", "details": str(e)}), 500

    elapsed = round(time.time() - start, 3)
    logger.info(f"[SCAN] Complete for {url} in {elapsed}s")

    # ── Background DB writes (off critical path) ───────────────────────────────
    screenshot_url = crawler_results.get("screenshot_url")

    if screenshot_url:
        # Store screenshot reference — daemon=True so it dies with the process
        # if the worker shuts down before finishing (no data loss risk: Cloudinary
        # already has the image; we're just writing the URL to MongoDB)
        threading.Thread(
            target=_store_screenshot_bg,
            args=(url, screenshot_url),
            daemon=True,
        ).start()

    # Persist crawler_results into the existing VT scan record for future cache hits
    threading.Thread(
        target=_update_cached_crawler_results,
        args=(url, crawler_results),
        daemon=True,
    ).start()

    return jsonify({
        "url":            url,
        "crawler_results": crawler_results,
        "cached":         False,
        "execution_time": elapsed,
    })