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
    probe = ff.probe(file_path)
    video_streams = [stream for stream in probe["streams"] if stream["codec_type"] == "video"]
    return int(video_streams[0]['nb_frames'])

def extract_N_video_frames(file_path: str, number_of_samples: int = 6) -> List[np.ndarray]:
    nb_frames = get_number_of_frames(file_path)
    video_frames = []
    random_indexes = random.sample(range(0, nb_frames), number_of_samples)
    cap = cv2.VideoCapture(file_path)
    for ind in random_indexes:
        cap.set(1, ind)
        res, frame = cap.read()
        if res:
            video_frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    cap.release()
    return video_frames

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
    

    transcription = whisper_model.transcribe(file_path)['text']
    print(f"Transcription: {transcription}")
    print(f"Predicting personality for file 1: {file_path}")
    # Audio
    audio_raw = extract_audio_from_video(file_path)
    audio_input = preprocess_audio_series(audio_raw)
    print(f"Predicting personality for file 2: {file_path}")
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
