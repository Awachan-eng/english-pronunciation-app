const phraseElement = document.getElementById("phrase");
const result = document.getElementById("result");
const sampleButton = document.getElementById("sampleButton");
const recordButton = document.getElementById("recordButton");
const retryButton = document.getElementById("retryButton");
const statusText = document.getElementById("status");

const correctText = phraseElement.textContent.trim();

const SpeechRecognitionClass =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

const errorMessages = {
    "not-allowed": "マイクの使用が許可されていません。ブラウザの設定で許可してください。",
    "service-not-allowed": "このブラウザでは音声認識サービスが許可されていません。",
    "audio-capture": "マイクが見つかりません。接続や他のアプリの使用状況を確認してください。",
    "network": "ネットワークエラーです。通信状況を確認してください。",
    "language-not-supported": "英語の音声認識に対応していません。",
    "no-speech": "音声が聞き取れませんでした。もう一度話してください。",
    "aborted": "認識が中断されました。"
};

let recognition = null;
let isListening = false;
let resultReceived = false;
let lastError = "";

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function normalizeWords(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9'\s]/g, " ")
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
}

function findMatchedIndexes(correctWords, spokenWords) {
    const n = correctWords.length;
    const m = spokenWords.length;
    const dp = [];

    for (let i = 0; i <= n; i++) {
        dp.push(new Array(m + 1).fill(0));
    }

    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            if (correctWords[i] === spokenWords[j]) {
                dp[i][j] = dp[i + 1][j + 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    const matched = new Array(n).fill(false);
    let i = 0;
    let j = 0;

    while (i < n && j < m) {
        if (correctWords[i] === spokenWords[j]) {
            matched[i] = true;
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            i++;
        } else {
            j++;
        }
    }

    return matched;
}

function renderResult(transcript, confidence) {
    const spokenWords = normalizeWords(transcript);
    const correctWords = normalizeWords(correctText);
    const matched = findMatchedIndexes(correctWords, spokenWords);

    let comparisonHTML = "";
    let matchedCount = 0;

    correctWords.forEach((word, index) => {
        if (matched[index]) {
            matchedCount++;
            comparisonHTML += `<span>${word}</span> `;
        } else {
            comparisonHTML += `<span class="wrong">${word}</span> `;
        }
    });

    const confidenceText = confidence > 0
        ? Math.round(confidence * 100) + "%"
        : "取得できませんでした";

    result.innerHTML =
        "<p>認識結果：</p><p>" +
        escapeHtml(transcript.trim()) +
        "</p><p>お手本との比較：</p><p>" +
        comparisonHTML +
        "</p><p>" +
        matchedCount +
        " / " +
        correctWords.length +
        " 語 一致</p><p>認識の信頼度：" +
        confidenceText +
        "</p>";
}

function setListening(value) {
    isListening = value;
    recordButton.textContent = value ? "⏹ 認識を終了" : "🎤 認識を開始";
}

function startRecognition() {
    if (!SpeechRecognitionClass) {
        statusText.textContent =
            "このブラウザは音声認識に対応していません。Chromeで開いてください。";
        return;
    }

    result.innerHTML = "";
    resultReceived = false;
    lastError = "";

    recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        setListening(true);
        statusText.textContent = "🔴 認識中です。英語を話してください！";
    };

    recognition.onresult = (event) => {
        const alternative = event.results[0][0];
        resultReceived = true;
        renderResult(alternative.transcript, alternative.confidence);
    };

    recognition.onerror = (event) => {
        lastError = event.error;
    };

    recognition.onend = () => {
        setListening(false);

        if (resultReceived) {
            statusText.textContent = "認識結果を表示しました。";
        } else if (lastError) {
            statusText.textContent =
                errorMessages[lastError] || "音声認識エラー：" + lastError;
        } else {
            statusText.textContent =
                "音声を認識できませんでした。もう一度話してください。";
        }
    };

    try {
        recognition.start();
    } catch (error) {
        setListening(false);
        statusText.textContent = "音声認識を開始できませんでした。";
        console.error(error);
    }
}

sampleButton.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) {
        statusText.textContent = "このブラウザはお手本の読み上げに対応していません。";
        return;
    }

    const utterance = new SpeechSynthesisUtterance(correctText);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    statusText.textContent = "🔊 お手本を再生中です！";
});

recordButton.addEventListener("click", () => {
    if (isListening) {
        if (recognition) {
            recognition.stop();
        }
        return;
    }

    startRecognition();
});

retryButton.addEventListener("click", () => {
    if (isListening) {
        statusText.textContent = "先に認識を終了してください。";
        return;
    }

    result.innerHTML = "";
    statusText.textContent = "認識待機中";
});
