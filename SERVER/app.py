from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging

from routes.user_routes import user_bp
from routes.job_routes import job_bp

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS with specific configuration
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Register blueprints with /api prefix
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(job_bp, url_prefix='/api')
logger.info("Blueprints registered with prefix '/api'")


if __name__ == '__main__':
    logger.info("Starting Flask application...")
    logger.info(f"Upload folder: {UPLOAD_FOLDER}")
    app.run(debug=True, host='0.0.0.0', port=5000)
