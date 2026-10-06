const recordButton = document.getElementById("recordButton");
const status = document.getElementById("status");
const result = document.getElementById("result");

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (!SpeechRecognition) {
    status.textContent = "このブラウザは音声認識に対応していません。";
} else {
    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        status.textContent = "🎤 音声認識中です！英語を話してください。";
    };

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;

        status.textContent = "音声認識が完了しました。";

        recognition.onspeechstart = () => {
    status.textContent = "👂 声を検出しました！";
};

recognition.onspeechend = () => {
    status.textContent = "⏳ 声の検出が終了しました。";
};

        result.innerHTML =
            "<p>認識結果：</p>" +
            "<p>" + text + "</p>";
    };

    recognition.onerror = (event) => {
        status.textContent =
            "音声認識エラー：" + event.error;
    };

    recognition.onend = () => {
        console.log("音声認識終了");
    };
}

recordButton.addEventListener("click", () => {
    if (!recognition) return;

    try {
        recognition.start();
    } catch (error) {
        status.textContent =
            "開始エラー：" + error.message;
    }
});
