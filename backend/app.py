from flask import Flask
from flask_cors import CORS
import cloudinary
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Debugging: Check if Cloudinary credentials are loaded (Remove in production)
print("Cloudinary Config:")
print("Cloud Name:", os.getenv("CLOUDINARY_CLOUD_NAME"))
print("API Key:", os.getenv("CLOUDINARY_API_KEY"))
print("API Secret:", os.getenv("CLOUDINARY_API_SECRET"))

# Flask app initialization
app = Flask(__name__)
CORS(app)

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

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True, threaded=True)
