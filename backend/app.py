from flask import Flask, jsonify
from flask_cors import CORS
import cloudinary
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables from .env (local dev only — Render injects them directly)
load_dotenv()

app = Flask(__name__)

# ── CORS 
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS(app, resources={r"/*": {"origins": [FRONTEND_URL, "*"]}})

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY    = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not CLOUDINARY_CLOUD_NAME or not CLOUDINARY_API_KEY or not CLOUDINARY_API_SECRET:
    raise ValueError("Cloudinary environment variables are missing. Check your .env / Render env settings.")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)

from routes.crawler_routes   import crawler_bp
from routes.virustotal_routes import virustotal_bp
from routes.db_routes        import db_bp

app.register_blueprint(crawler_bp,    url_prefix="/crawler")
app.register_blueprint(virustotal_bp, url_prefix="/virustotal")
app.register_blueprint(db_bp,         url_prefix="/db")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "bullseye-backend",
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, threaded=True, debug=False)