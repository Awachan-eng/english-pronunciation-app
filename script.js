alert("最新版です！");

const sampleButton = document.getElementById("sampleButton");
const recordButton = document.getElementById("recordButton");
const status = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");

// お手本音声
sampleButton.addEventListener("click", () => {
    const sampleAudio = new Audio("ttsmaker-file-2026-10-6-11-6-27.mp3");
    sampleAudio.play();
    status.textContent = "🔊 お手本を再生中です！";
});

// 録音
let mediaRecorder;
let audioChunks = [];

recordButton.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", (event) => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                const audioBlob = new Blob(audioChunks, {
                    type: "audio/webm"
                });

                const audioURL = URL.createObjectURL(audioBlob);
                audioPlayer.src = audioURL;

                status.textContent = "音声を解析しています……";

                if (window.recognition) {
    window.recognition.stop();
                }

                stream.getTracks().forEach(track => track.stop());
            });

            mediaRecorder.start();

            recordButton.textContent = "⏹ 録音停止";
            status.textContent = "🔴 録音中です！";

            if (window.recognition) {
    try {
        window.recognition.start();
    } catch (error) {
        console.error(error);
    }
            }

        } catch (error) {
            console.error(error);
            status.textContent = "マイクを使用できませんでした。";
        }

    } else {
        mediaRecorder.stop();
        recordButton.textContent = "🎤 録音開始";
    }
});

// 音声認識
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        status.textContent = "認識結果：" + text;
    };

    recognition.onerror = (event) => {
        status.textContent = "音声認識エラー：" + event.error;
    };

    recognition.onend = () => {
        console.log("音声認識終了");
    };

    window.recognition = recognition;
}
