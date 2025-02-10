from flask import Flask, render_template, request, jsonify
from langdetect import detect
import base64
import wave
import io

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect_language', methods=['POST'])
def detect_language():
    # Get the audio data from the request
    audio_data = request.json.get('audio')
    audio_bytes = base64.b64decode(audio_data.split(',')[1])

    # Save the audio to a temporary WAV file
    with wave.open('temp.wav', 'wb') as wf:
        wf.setnchannels(1)  # Mono
        wf.setsampwidth(2)  # 2 bytes (16-bit)
        wf.setframerate(44100)  # 44.1 kHz
        wf.writeframes(audio_bytes)

    # Detect the language (this is a placeholder; langdetect works on text)
    # For real-time language detection, you might need a speech-to-text API.
    detected_language = "Language detection requires text input."

    return jsonify({'language': detected_language})

if __name__ == '__main__':
    app.run(debug=True)