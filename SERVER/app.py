from flask import Flask, request, jsonify
import os
from predictor_module import predict_personality

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/predict', methods=['POST'])
def predict():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400

    video = request.files['video']
    print(f"Received video file: {video}")
    if video.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filepath = os.path.join(UPLOAD_FOLDER, video.filename)
    print(f"Saving video to: {filepath}")
    video.save(filepath)

    try:
        results = predict_personality(filepath)
        return jsonify({'personality_scores': results})
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(debug=False)
