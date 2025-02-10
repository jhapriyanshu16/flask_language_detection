let audioContext;
let analyser;
let microphone;
let canvasContext;
let chart;
let isRecording = false;

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);

            // Set up the audio chart
            canvasContext = document.getElementById('audioChart').getContext('2d');
            chart = new Chart(canvasContext, {
                type: 'line',
                data: {
                    labels: Array.from({ length: 256 }, (_, i) => i),
                    datasets: [{
                        label: 'Audio Frequency',
                        data: new Array(256).fill(0),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });

            // Start processing audio data
            isRecording = true;
            processAudio();

            // Enable/disable buttons
            document.getElementById('startRecording').disabled = true;
            document.getElementById('stopRecording').disabled = false;
        })
        .catch(err => {
            console.error('Error accessing microphone:', err);
        });
}

function stopRecording() {
    isRecording = false;
    if (microphone) {
        microphone.disconnect();
    }
    if (audioContext) {
        audioContext.close();
    }

    // Enable/disable buttons
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
}

function processAudio() {
    if (!isRecording) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Update the chart
    chart.data.datasets[0].data = Array.from(dataArray);
    chart.update();

    // Send audio data to the server for language detection
    sendAudioData(dataArray);

    requestAnimationFrame(processAudio);
}

function sendAudioData(dataArray) {
    // Convert the audio data to a WAV file (simplified example)
    const audioBlob = new Blob([dataArray], { type: 'audio/wav' });
    const reader = new FileReader();
    reader.onload = function () {
        const base64Audio = reader.result.split(',')[1];
        fetch('/detect_language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: `data:audio/wav;base64,${base64Audio}` })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('languageOutput').textContent = data.language;
        });
    };
    reader.readAsDataURL(audioBlob);
}