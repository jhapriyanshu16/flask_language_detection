console.log("Script loaded");

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");

    // DOM elements
    const startRecordingButton = document.getElementById('startRecording');
    const stopRecordingButton = document.getElementById('stopRecording');
    const languageOutput = document.getElementById('languageOutput');
    const audioChartCanvas = document.getElementById('audioChart');

    // Audio variables
    let audioContext;
    let analyser;
    let microphone;
    let chart;
    let isRecording = false;

    // Check if DOM elements exist
    if (!startRecordingButton || !stopRecordingButton || !languageOutput || !audioChartCanvas) {
        console.error("Required DOM elements not found");
        return;
    }

    // Initialize the audio chart
    const canvasContext = audioChartCanvas.getContext('2d');
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

    // Start Recording Button
    startRecordingButton.addEventListener('click', () => {
        console.log("Start Recording button clicked");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("getUserMedia is not supported in this browser");
            return;
        }

        // Request microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log("Microphone access granted");

                // Initialize AudioContext and Analyser
                audioContext = new AudioContext();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);

                // Start processing audio data
                isRecording = true;
                processAudio();

                // Enable/disable buttons
                startRecordingButton.disabled = true;
                stopRecordingButton.disabled = false;
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
            });
    });

    // Stop Recording Button
    stopRecordingButton.addEventListener('click', () => {
        console.log("Stop Recording button clicked");

        // Stop recording
        isRecording = false;
        if (microphone) {
            microphone.disconnect();
        }
        if (audioContext) {
            audioContext.close();
        }

        // Enable/disable buttons
        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;
    });

    // Process audio data
    function processAudio() {
        if (!isRecording) return;

        // Get frequency data from the analyser
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Update the chart
        chart.data.datasets[0].data = Array.from(dataArray);
        chart.update();

        // Send audio data to the server for language detection
        sendAudioData(dataArray);

        // Continue processing audio data
        requestAnimationFrame(processAudio);
    }

    // Send audio data to the server
    function sendAudioData(dataArray) {
        // Convert the audio data to a WAV file (simplified example)
        const audioBlob = new Blob([dataArray], { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onload = function () {
            const base64Audio = reader.result.split(',')[1];

            // Send the audio data to the Flask server
            fetch('/detect_language', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: `data:audio/wav;base64,${base64Audio}` })
            })
            .then(response => response.json())
            .then(data => {
                // Update the detected language on the page
                languageOutput.textContent = data.language;
            })
            .catch(err => {
                console.error('Error sending audio data:', err);
            });
        };
        reader.readAsDataURL(audioBlob);
    }
});