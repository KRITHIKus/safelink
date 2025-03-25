from flask import Flask
from flask_cors import CORS
import cloudinary
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ✅ Allow requests from your frontend
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# Configure Cloudinary (Explicitly setting it here)
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Import and register blueprints
from routes.crawler_routes import crawler_bp
from routes.virustotal_routes import virustotal_bp
from routes.db_routes import db_bp

app.register_blueprint(crawler_bp, url_prefix="/crawler")
app.register_blueprint(virustotal_bp, url_prefix="/virustotal")
app.register_blueprint(db_bp, url_prefix="/db")

# ✅ Run the Flask app with Gunicorn compatibility
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), threaded=True)
