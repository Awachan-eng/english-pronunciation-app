const sampleButton = document.getElementById("sampleButton");
const recordButton = document.getElementById("recordButton");
const status = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");

let mediaRecorder;
let audioChunks = [];

sampleButton.addEventListener("click", () => {
    const sampleAudio = new Audio("ttsmaker-file-2026-10-6-11-6-27.mp3");
    sampleAudio.play();

    status.textContent = "🔊 お手本を再生中です！";
});

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

                status.textContent =
                    "録音完了！音声を再生できます。";

                stream.getTracks().forEach(track => track.stop());
            });

            mediaRecorder.start();

            recordButton.textContent = "⏹ 録音停止";
            status.textContent = "🔴 録音中です！";

        } catch (error) {

            console.error(error);

            status.textContent =
                "マイクを使用できませんでした。";
        }

    } else {

        mediaRecorder.stop();

        recordButton.textContent = "🎤 録音開始";
    }
});
