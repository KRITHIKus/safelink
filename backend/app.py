from flask import Flask
from flask_cors import CORS
import cloudinary
import os
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

app = Flask(__name__)

# ✅ Get the frontend URL from .env
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")  # Default to localhost if not set

# ✅ Expanded CORS Policy (Fixes CORS Errors)
CORS(app, resources={r"/*": {"origins": [FRONTEND_URL, "*"]}})

# ✅ Cloudinary Configuration with Error Handling
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not CLOUDINARY_CLOUD_NAME or not CLOUDINARY_API_KEY or not CLOUDINARY_API_SECRET:
    raise ValueError("❌ Cloudinary environment variables are missing!")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

# ✅ Import and register blueprints
from routes.crawler_routes import crawler_bp
from routes.virustotal_routes import virustotal_bp
from routes.db_routes import db_bp

app.register_blueprint(crawler_bp, url_prefix="/crawler")
app.register_blueprint(virustotal_bp, url_prefix="/virustotal")
app.register_blueprint(db_bp, url_prefix="/db")

# ✅ Ensure Gunicorn does not timeout (Only applies if using Gunicorn)
if __name__ != "__main__":
    os.environ["GUNICORN_CMD_ARGS"] = "--timeout 120 --workers 3 --threads 4"

# ✅ Run the Flask app with the correct port (Fixes 502 Bad Gateway)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, threaded=True)
