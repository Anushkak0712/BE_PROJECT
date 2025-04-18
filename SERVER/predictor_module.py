import os
import random
import numpy as np
import ffmpeg as ff
import cv2
import librosa
import torch
import whisper
from typing import Tuple, List, Dict
from transformers import BertTokenizer, BertModel
import tensorflow as tf

# Load models once
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
bert_model = BertModel.from_pretrained('bert-base-uncased')
whisper_model = whisper.load_model("base.en")
predictor = tf.keras.models.load_model('./first_impressions_model2.keras', safe_mode=False)


def extract_audio_from_video(file_path: str) -> np.ndarray:
    inputfile = ff.input(file_path)
    out = inputfile.output('-', format='f32le', acodec='pcm_f32le', ac=1, ar='44100')
    raw = out.run(capture_stdout=True, capture_stderr=True)
    return np.frombuffer(raw[0], np.float32)

def preprocess_audio_series(raw_data: np.ndarray) -> np.ndarray:
    N, M = 24, 1319
    mfcc_data = librosa.feature.mfcc(y=raw_data, sr=44100, n_mfcc=24)
    mfcc_data_standardized = (mfcc_data - np.mean(mfcc_data)) / np.std(mfcc_data)
    padding = np.zeros((N, M - mfcc_data_standardized.shape[1]))
    padded_data = np.hstack((padding, mfcc_data_standardized))
    return padded_data.reshape(N, M, 1)

def get_number_of_frames(file_path: str) -> int:
    try:
        # Check if file exists and is readable
        if not os.path.exists(file_path):
            raise ValueError("Video file does not exist")
            
        # Get file size
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise ValueError("Video file is empty")
            
        # Use OpenCV to get actual frame count and properties
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")
            
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        # If we couldn't get frame count directly, try to count frames
        if total_frames <= 0:
            print("Could not get frame count directly, counting frames...")
            total_frames = 0
            while True:
                ret, _ = cap.read()
                if not ret:
                    break
                total_frames += 1
            duration = total_frames / fps if fps > 0 else 0
            # Reset video capture
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        
        print(f"Video properties - Duration: {duration:.2f}s, FPS: {fps:.2f}, Total frames: {total_frames}")
        
        if total_frames <= 0:
            raise ValueError("Could not determine number of frames in video")
            
        cap.release()
        return total_frames
        
    except Exception as e:
        print(f"Error details: {str(e)}")
        raise ValueError(f"Error processing video file: {str(e)}")

def extract_N_video_frames(file_path: str, number_of_samples: int = 6) -> List[np.ndarray]:
    try:
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")
            
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        # If we couldn't get frame count directly, count frames
        if total_frames <= 0:
            print("Could not get frame count directly, counting frames...")
            total_frames = 0
            frame_positions = []
            while True:
                ret, _ = cap.read()
                if not ret:
                    break
                frame_positions.append(cap.get(cv2.CAP_PROP_POS_FRAMES))
                total_frames += 1
            duration = total_frames / fps if fps > 0 else 0
            print(f"Counted {total_frames} frames at positions: {frame_positions}")
            # Reset video capture
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        
        print(f"Video properties - Duration: {duration:.2f}s, FPS: {fps:.2f}, Total frames: {total_frames}")
        
        if total_frames < number_of_samples:
            raise ValueError(f"Video is too short. Expected at least {number_of_samples} frames, got {total_frames}")
            
        video_frames = []
        sample_size = min(number_of_samples, total_frames)
        
        # Instead of using frame indices, sample at specific time points
        time_points = [duration * i / (sample_size - 1) for i in range(sample_size)]
        print(f"Sampling at time points: {time_points}")
        
        for time_point in time_points:
            # Convert time to frame position
            frame_pos = int(time_point * fps)
            print(f"Attempting to read frame at time {time_point:.2f}s (position {frame_pos})")
            
            # Try to read the frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
            res, frame = cap.read()
            
            if not res:
                print(f"Warning: Could not read frame at position {frame_pos}")
                # Try reading frames sequentially until we get a valid one
                for offset in range(-5, 6):  # Try 5 frames before and after
                    if frame_pos + offset < 0:
                        continue
                    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos + offset)
                    res, frame = cap.read()
                    if res:
                        print(f"Successfully read frame at offset {offset}")
                        break
                        
                if not res:
                    raise ValueError(f"Could not read any frames near position {frame_pos}")
                    
            video_frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
        cap.release()
        return video_frames
    except Exception as e:
        raise ValueError(f"Error extracting video frames: {str(e)}")

def resize_image(image: np.ndarray, new_size: Tuple[int, int]) -> np.ndarray:
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)

def crop_image_window(image: np.ndarray, training: bool = False) -> np.ndarray:
    height, width, _ = image.shape
    N_index = (height - 128) // 2
    M_index = (width - 128) // 2
    return image[N_index:N_index+128, M_index:M_index+128, :]

def get_text_embeddings(text: str) -> np.ndarray:
    if not text:
        return np.zeros((768,))
    tokens = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = bert_model(**tokens)
    return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

def predict_personality(file_path: str) -> Dict[str, float]:
    try:
        # Validate file exists and is readable
        if not os.path.exists(file_path):
            raise ValueError("Video file does not exist")
            
        # Get file size
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise ValueError("Video file is empty")
            
        transcription = whisper_model.transcribe(file_path)['text']
        print(f"Transcription: {transcription}")
        print(f"Predicting personality for file: {file_path}")
        
        # Audio
        audio_raw = extract_audio_from_video(file_path)
        audio_input = preprocess_audio_series(audio_raw)
        
        # Video
        sampled = extract_N_video_frames(file_path, number_of_samples=6)
        resized_images = [resize_image(im, (248, 140)) for im in sampled]
        cropped_images = [crop_image_window(img) / 255.0 for img in resized_images]
        video_input = np.stack(cropped_images)

        # Text
        text_embedding = get_text_embeddings(transcription)

        # Predict
        preds = predictor.predict([
            np.expand_dims(audio_input, axis=0),
            np.expand_dims(video_input, axis=0),
            np.expand_dims(text_embedding, axis=0)
        ])[0]

        traits = ['extraversion', 'neuroticism', 'agreeableness', 'conscientiousness', 'openness']
        return dict(zip(traits, preds.tolist()))
    except Exception as e:
        raise ValueError(f"Error processing video: {str(e)}")
