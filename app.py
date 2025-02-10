from flask import Flask, render_template, request, jsonify
from langdetect import detect
import base64
import os
from google.cloud import speech_v1p1beta1 as speech

app = Flask(__name__)

# Google Cloud Speech-to-Text client
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/your/google-credentials.json"  # Replace with your credentials file
client = speech.SpeechClient()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect_language', methods=['POST'])
def detect_language():
    # Get the audio data from the request
    audio_data = request.json.get('audio')
    audio_bytes = base64.b64decode(audio_data.split(',')[1])

    # Transcribe audio to text using Google Speech-to-Text
    try:
        transcription = transcribe_audio(audio_bytes)
        if not transcription:
            return jsonify({'language': 'Unable to transcribe audio'})

        # Detect the language of the transcribed text
        detected_language = detect(transcription)
        return jsonify({'language': detected_language})
    except Exception as e:
        return jsonify({'language': f'Error: {str(e)}'})

def transcribe_audio(audio_bytes):
    # Configure the audio settings
    audio = speech.RecognitionAudio(content=audio_bytes)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=44100,
        language_code="en-US",  # Default language (can be auto-detected)
        enable_automatic_punctuation=True,
    )

    # Transcribe the audio
    response = client.recognize(config=config, audio=audio)
    if not response.results:
        return None

    # Get the transcribed text
    transcription = response.results[0].alternatives[0].transcript
    return transcription

if __name__ == '__main__':
    app.run(debug=True)