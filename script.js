const result = document.getElementById("result");

result.innerHTML =
    "<p>音声認識の対応状況</p>" +
    "<p>SpeechRecognition：" +
    (window.SpeechRecognition ? "対応" : "非対応") +
    "</p>" +
    "<p>webkitSpeechRecognition：" +
    (window.webkitSpeechRecognition ? "対応" : "非対応") +
    "</p>";

const sampleButton = document.getElementById("sampleButton");
const recordButton = document.getElementById("recordButton");
const status = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");
const recognitionButton =
    document.getElementById("recognitionButton");

let mediaRecorder;
let audioChunks = [];

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

        result.innerHTML =
            "<p>認識結果：</p>" +
            "<p>" + text + "</p>";
    };

    recognition.onerror = (event) => {
        result.innerHTML =
            "<p>音声認識エラー：" +
            event.error +
            "</p>";
    };
}

sampleButton.addEventListener("click", () => {
    const sampleAudio =
        new Audio("ttsmaker-file-2026-10-6-11-6-27.mp3");

    sampleAudio.play();

    status.textContent = "🔊 お手本を再生中です！";
});

recordButton.addEventListener("click", async () => {

    if (!mediaRecorder || mediaRecorder.state === "inactive") {

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.addEventListener(
                "dataavailable",
                (event) => {
                    audioChunks.push(event.data);
                }
            );

            mediaRecorder.addEventListener("stop", () => {

                const audioBlob = new Blob(audioChunks, {
                    type: "audio/webm"
                });

                const audioURL =
                    URL.createObjectURL(audioBlob);

                audioPlayer.src = audioURL;

                audioPlayer.onloadedmetadata = () => {

                    const duration =
                        audioPlayer.duration;

                    status.textContent =
    "録音完了！音声認識を確認します。";

result.innerHTML =
    "<p>音声認識の対応状況を確認中です。</p>" +
    "<p>SpeechRecognition：" +
    (window.SpeechRecognition ? "対応" : "非対応") +
    "</p>" +
    "<p>webkitSpeechRecognition：" +
    (window.webkitSpeechRecognition ? "対応" : "非対応") +
    "</p>";

                    result.innerHTML =
                        "<p>録音時間：" +
                        duration.toFixed(2) +
                        "秒</p>";
                };

                stream.getTracks().forEach(
                    track => track.stop()
                );

                if (recognition) {

                    status.textContent =
                        "🔍 音声を分析しています…";

                    const audioElement =
                        new Audio(audioURL);

                    audioElement.addEventListener(
                        "canplay",
                        async () => {

                            try {

                                const audioStream =
                                    audioElement.captureStream();

                                const audioTrack =
                                    audioStream
                                        .getAudioTracks()[0];

                                audioElement.play();

                                recognition.start(audioTrack);

                            } catch (error) {

                                result.innerHTML =
                                    "<p>音声認識を開始できませんでした。</p>" +
                                    "<p>" +
                                    error.message +
                                    "</p>";
                            }
                        }
                    );

                    audioElement.load();
                }
            });

            mediaRecorder.start();

            recordButton.textContent =
                "⏹ 録音停止";

            status.textContent =
                "🔴 録音中です！";

        } catch (error) {

            console.error(error);

            status.textContent =
                "マイクを使用できませんでした。";
        }

    } else {

        mediaRecorder.stop();

        recordButton.textContent =
            "🎤 録音開始";
    }
});

recognitionButton.addEventListener("click", () => {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        status.textContent =
            "このブラウザは音声認識に対応していません。";
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        status.textContent =
            "🎤 英語を話してください！";
    };

    recognition.onresult = (event) => {
        const text =
            event.results[0][0].transcript;

        result.innerHTML =
            "<p>認識結果：</p><p>" +
            text +
            "</p>";

        status.textContent =
            "音声認識が完了しました。";
    };

    recognition.onerror = (event) => {
        status.textContent =
            "音声認識エラー：" + event.error;
    };

    recognition.start();
});
