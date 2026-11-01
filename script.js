const result = document.getElementById("result");
const sampleButton = document.getElementById("sampleButton");
const recordButton = document.getElementById("recordButton");
const retryButton = document.getElementById("retryButton");
const statusText = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");

const correctText = "I want to go to the park.";

const SpeechRecognitionClass =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let mediaRecorder = null;
let audioChunks = [];
let micStream = null;
let recognition = null;
let isRecording = false;
let recognitionRunning = false;
let recognitionResultReceived = false;
let recognitionError = "";
let recognitionFatal = false;
let finalText = "";

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

function renderResult() {
    const spokenWords = normalizeWords(finalText);
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

    result.innerHTML =
        "<p>認識結果：</p><p>" +
        escapeHtml(finalText.trim()) +
        "</p><p>お手本との比較：</p><p>" +
        comparisonHTML +
        "</p><p>" +
        matchedCount +
        " / " +
        correctWords.length +
        " 語 一致</p>";
}

function releaseMic() {
    if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        micStream = null;
    }
}

function finalizeStatus() {
    if (recognitionResultReceived) {
        statusText.textContent =
            "認識結果を表示しました。録音も保存しました。";
    } else if (!SpeechRecognitionClass) {
        statusText.textContent =
            "録音を保存しました。このブラウザは音声認識に対応していません。";
    } else if (recognitionError) {
        statusText.textContent =
            "音声認識エラー：" + recognitionError + "（録音は保存しました）";
    } else {
        statusText.textContent =
            "録音は保存しましたが、認識結果は受け取れませんでした。";
    }
}

function startRecognition() {
    recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
        recognitionRunning = true;
    };

    recognition.onresult = (event) => {
        let text = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                text += event.results[i][0].transcript + " ";
            }
        }

        if (!text.trim()) return;

        recognitionResultReceived = true;
        finalText += text;
        renderResult();

        if (isRecording) {
            statusText.textContent =
                "🔴 録音・音声認識中です。続けて話すか、終了を押してください。";
        }
    };

    recognition.onerror = (event) => {
        recognitionError = event.error;

        if (event.error === "no-speech" || event.error === "aborted") {
            return;
        }

        recognitionFatal = true;

        if (isRecording) {
            statusText.textContent =
                "音声認識エラー：" +
                event.error +
                "（録音は続いています）";
        }
    };

    recognition.onend = () => {
        recognitionRunning = false;

        if (isRecording && !recognitionFatal) {
            setTimeout(() => {
                if (isRecording && !recognitionFatal) {
                    try {
                        startRecognition();
                    } catch (error) {
                        recognitionError = String(error);
                        recognitionFatal = true;
                    }
                }
            }, 150);
            return;
        }

        if (!isRecording) {
            finalizeStatus();
        }
    };

    recognition.start();
}

async function startRecording() {
    try {
        result.innerHTML = "";
        audioChunks = [];
        finalText = "";
        recognitionResultReceived = false;
        recognitionError = "";
        recognitionFatal = false;
        recognitionRunning = false;

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
            releaseMic();

            if (!recognitionRunning) {
                finalizeStatus();
            }
        });

        mediaRecorder.start();
        isRecording = true;
        recordButton.textContent = "⏹ 録音・認識を終了";
        statusText.textContent =
            "🔴 録音・音声認識中です。英語を話してください！";

        if (SpeechRecognitionClass) {
            startRecognition();
        } else {
            statusText.textContent =
                "録音中です。音声認識はこのブラウザで利用できません。";
        }
    } catch (error) {
        isRecording = false;
        recordButton.textContent = "🎤 録音・認識を開始";

        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }

        releaseMic();

        statusText.textContent =
            "録音を開始できませんでした。マイクの許可を確認してください。";
        console.error(error);
    }
}

function stopRecording() {
    isRecording = false;
    recordButton.textContent = "🎤 録音・認識を開始";
    statusText.textContent = "録音を終了しました。結果を処理しています…";

    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    }

    if (recognition && recognitionRunning) {
        try {
            recognition.stop();
        } catch (error) {
            console.log(error);
        }
    }
}

sampleButton.addEventListener("click", () => {
    const sampleAudio =
        new Audio("ttsmaker-file-2026-10-6-11-6-27.mp3");

    sampleAudio.play();
    statusText.textContent = "🔊 お手本を再生中です！";
});

recordButton.addEventListener("click", async () => {
    if (isRecording) {
        stopRecording();
        return;
    }

    await startRecording();
});

retryButton.addEventListener("click", () => {
    if (isRecording) {
        statusText.textContent = "先に録音・認識を終了してください。";
        return;
    }

    result.innerHTML = "";
    statusText.textContent = "録音待機中";
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioChunks = [];
    finalText = "";
    recognitionResultReceived = false;
    recognitionError = "";

    alert("もう一度、お手本を聞いて練習しましょう！");
});
