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

// 音声認識
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const correctText = "I want to go to the park.";

    status.textContent = "認識結果：" + text;

    const result = document.getElementById("result");

    const spokenWords = text
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .split(/\s+/);

    const correctWords = correctText
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .split(/\s+/);

    let html = "";

    correctWords.forEach((word, index) => {
        if (spokenWords[index] === word) {
            html += `<span>${word}</span> `;
        } else {
            html += `<span class="wrong">${word}</span> `;
        }
    });

    result.innerHTML =
        "<p>あなたの発音：</p>" +
        html;
};

    recognition.onerror = (event) => {
        status.textContent = "音声認識エラー：" + event.error;
    };

    recognition.onend = () => {
    status.textContent = "⚠️ 音声認識が終了しました";
};

recognition.onspeechstart = () => {
    status.textContent = "👂 声を検出しました！";
};

recognition.onspeechend = () => {
    status.textContent = "⏳ 声の検出が終了しました。";
};
}

// 録音
let mediaRecorder;
let audioChunks = [];

recordButton.addEventListener("click", async () => {

    // 録音開始
    if (!mediaRecorder || mediaRecorder.state === "inactive") {

        // まず音声認識を開始
        if (recognition) {
            try {
                recognition.start();
                status.textContent = "🎤 音声認識中です！話してください。";
            } catch (error) {
                console.error(error);
            }
        } else {
            status.textContent = "音声認識が利用できません。";
        }

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

                if (recognition) {
                    recognition.stop();
                }

                stream.getTracks().forEach(track => track.stop());
            });

            mediaRecorder.start();

            recordButton.textContent = "⏹ 録音停止";

        } catch (error) {
            console.error(error);
            status.textContent = "マイクを使用できませんでした。";
        }

    } else {

        // 録音停止
        mediaRecorder.stop();
        recordButton.textContent = "🎤 録音開始";
    }
});
