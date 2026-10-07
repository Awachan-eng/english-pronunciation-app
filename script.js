
const result = document.getElementById("result");
const sampleButton = document.getElementById("sampleButton");
const recordButton = document.getElementById("recordButton");
const status = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");

let mediaRecorder = null;
let audioChunks = [];
let micStream = null;
let recognition = null;
let isRecording = false;
let recognitionResultReceived = false;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

sampleButton.addEventListener("click", () => {
    const sampleAudio =
        new Audio("ttsmaker-file-2026-10-6-11-6-27.mp3");

    sampleAudio.play();
    status.textContent = "🔊 お手本を再生中です！";
});

recordButton.addEventListener("click", async () => {
    if (isRecording) {
        isRecording = false;

        if (mediaRecorder &&
            mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }

        if (recognition) {
            try {
                recognition.stop();
            } catch (error) {
                console.log(error);
            }
        }

        recordButton.textContent = "🎤 録音・認識を開始";
        status.textContent = "録音を終了しました。結果を処理しています…";
        return;
    }

    try {
        result.innerHTML = "";
        audioChunks = [];
        recognitionResultReceived = false;

        micStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        mediaRecorder = new MediaRecorder(micStream);

        mediaRecorder.addEventListener("dataavailable", (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunks, {
                type: mediaRecorder.mimeType || "audio/webm"
            });

            audioPlayer.src = URL.createObjectURL(audioBlob);

            if (!recognitionResultReceived) {
                status.textContent =
                    "録音を保存しました。音声認識結果を確認してください。";
            }

            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
                micStream = null;
            }
        });

        mediaRecorder.start();
        isRecording = true;
        recordButton.textContent = "⏹ 録音・認識を終了";
        status.textContent = "🔴 録音・音声認識中です。英語を話してください！";

        if (!SpeechRecognition) {
            status.textContent =
                "録音中です。音声認識はこのブラウザで利用できません。";
            return;
        }

        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            let text = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                if (event.results[i].isFinal) {
                    text += event.results[i][0].transcript + " ";
                }
            }

            if (!text.trim()) return;

            recognitionResultReceived = true;

            const correctText = "I want to go to the park.";

            const spokenWords = text
                .toLowerCase()
                .replace(/[.,!?]/g, "")
                .trim()
                .split(/\s+/);

            const correctWords = correctText
                .toLowerCase()
                .replace(/[.,!?]/g, "")
                .split(/\s+/);

            let comparisonHTML = "";

            correctWords.forEach((word, index) => {
                if (spokenWords[index] === word) {
                    comparisonHTML += `<span>${word}</span> `;
                } else {
                    comparisonHTML += `<span class="wrong">${word}</span> `;
                }
            });

            result.innerHTML =
                "<p>認識結果：</p><p>" +
                text.trim() +
                "</p><p>お手本との比較：</p><p>" +
                comparisonHTML +
                "</p>";

            status.textContent = "認識結果を表示しました。";
        };

        recognition.onerror = (event) => {
            if (event.error !== "no-speech" &&
                event.error !== "aborted") {
                status.textContent =
                    "音声認識エラー：" + event.error;
            }
        };

        recognition.start();

    } catch (error) {
        isRecording = false;
        recordButton.textContent = "🎤 録音・認識を開始";

        if (mediaRecorder &&
            mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        } else if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }

        status.textContent =
            "録音を開始できませんでした。マイクの許可を確認してください。";
        console.error(error);
    }
});

const retryButton = document.getElementById("retryButton");

retryButton.addEventListener("click", () => {
    if (isRecording) {
        status.textContent =
            "先に録音・認識を終了してください。";
        return;
    }

    result.innerHTML = "";
    status.textContent = "録音待機中";
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioChunks = [];

    alert("もう一度、お手本を聞いて練習しましょう！");
});
