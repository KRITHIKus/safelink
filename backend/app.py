from flask import Flask
from flask_cors import CORS
from routes.crawler_routes import crawler_bp
from routes.virustotal_routes import virustotal_bp
from routes.db_routes import db_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(crawler_bp, url_prefix="/crawler")
app.register_blueprint(virustotal_bp, url_prefix="/virustotal")
app.register_blueprint(db_bp, url_prefix="/db")  # Correct prefix

if __name__ == "__main__":
    app.run(debug=True, threaded=True)
