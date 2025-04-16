from flask import Flask, request, jsonify
import os
import logging
from predictor_module import predict_personality
from routes.user_routes import user_bp
from routes.job_routes import job_bp

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(job_bp, url_prefix='/api')
logger.info("Blueprints registered with prefix '/api'")

@app.route('/predict', methods=['POST'])
def predict():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    logger.debug(f"Received video file: {video}")
    if video.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filepath = os.path.join(UPLOAD_FOLDER, video.filename)
    logger.debug(f"Saving video to: {filepath}")
    video.save(filepath)

    try:
        results = predict_personality(filepath)
        return jsonify({'personality_scores': results})
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    logger.info("Starting Flask application...")
    logger.info(f"Upload folder: {UPLOAD_FOLDER}")
    app.run(debug=True, host='0.0.0.0', port=5000)
