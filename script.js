const VERSION = "3";
const SAMPLE_AUDIO_FILE = "";

const phraseElement = document.getElementById("phrase");
const result = document.getElementById("result");
const tipsElement = document.getElementById("tips");
const totalScoreElement = document.getElementById("totalScore");
const statusText = document.getElementById("status");
const sampleButton = document.getElementById("sampleButton");
const recordButton = document.getElementById("recordButton");
const retryButton = document.getElementById("retryButton");

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

const wordInfo = {
    "the": { ipa: "/ðə/", sounds: ["th"] },
    "rabbit": { ipa: "/ˈræbɪt/", sounds: ["r", "ae"] },
    "runs": { ipa: "/rʌnz/", sounds: ["r", "uh"] },
    "around": { ipa: "/əˈraʊnd/", sounds: ["r", "ow"] },
    "lake": { ipa: "/leɪk/", sounds: ["l", "ei"] }
};

const soundInfo = {
    "th": {
        symbol: "/ð/",
        title: "th の音",
        advice: "舌先を上の前歯と下の前歯の間に軽く出し、歯に軽く当てたまま、声を出しながら息を出します。舌を歯の裏へ引っ込めてしまわないのがコツです。",
        common: "「ザ」や「ダ」になりやすい音です。",
        draw: {
            jaw: 0,
            protrude: 0,
            rounded: false,
            labelY: 104,
            note: "舌先を歯の間に出す",
            arrow: false,
            tongue: (j) =>
                "M44 " + (116 + j) +
                " C50 90 90 82 120 80 L157 74 L157 84 L136 " + (96 + j) +
                " L118 " + (108 + j) + " Z"
        }
    },
    "r": {
        symbol: "/r/",
        title: "r の音",
        advice: "舌先は上あごにつけません。舌を後ろに引いて奥のほうを盛り上げ、舌先を少し持ち上げます。唇を軽く丸めて前に出し、口の中で舌が何にも触れないまま声を出します。",
        common: "日本語のラ行のように、舌先をはじいてしまいやすい音です。",
        draw: {
            jaw: 0,
            protrude: 8,
            rounded: true,
            labelY: 100,
            note: "舌先はどこにも触れない",
            arrow: false,
            tongue: (j) =>
                "M44 " + (116 + j) +
                " C50 90 74 66 102 62 C114 60 122 64 120 72 C118 78 110 80 106 84 C110 94 118 100 120 " +
                (106 + j) + " L100 " + (110 + j) + " Z"
        }
    },
    "l": {
        symbol: "/l/",
        title: "l の音",
        advice: "舌先を上の前歯の裏のすぐ後ろ（歯ぐきの付け根）にしっかり押し当てます。舌先をつけたまま、舌の両脇から声を出します。舌先をはじかず、少し長めに保つと l らしくなります。",
        common: "r と混ざったり、日本語のラ行になったりしやすい音です。",
        draw: {
            jaw: 0,
            protrude: 0,
            rounded: false,
            labelY: 106,
            note: "舌先を歯ぐきにつける",
            arrow: false,
            tongue: (j) =>
                "M44 " + (116 + j) +
                " C54 100 84 92 108 84 C120 78 130 70 140 66 L145 70 C142 82 132 94 124 " +
                (104 + j) + " L112 " + (108 + j) + " Z"
        }
    },
    "ae": {
        symbol: "/æ/",
        title: "æ（rabbit の a）の音",
        advice: "口を縦に大きく開け、口角を少し横に引きます。「ア」と「エ」の中間の音を、舌先を下の前歯の裏に置いたまま出します。あごを下げる意識を持つと出しやすくなります。",
        common: "日本語の「ア」や「エ」になりやすい音です。",
        draw: {
            jaw: 14,
            protrude: 0,
            rounded: false,
            labelY: 125,
            note: "口を大きく開ける",
            arrow: false,
            tongue: (j) =>
                "M44 " + (116 + j) +
                " C60 " + (108 + j) + " 90 " + (100 + j) + " 120 " + (96 + j) +
                " L144 " + (94 + j) + " L144 " + (102 + j) +
                " L124 " + (108 + j) + " L100 " + (112 + j) + " Z"
        }
    },
    "uh": {
        symbol: "/ʌ/",
        title: "ʌ（runs の u）の音",
        advice: "口を軽く開け、力を抜いて短く「ア」と言います。日本語の「ア」より口の開きを小さくして、のどの奥から短く出します。",
        common: "日本語の「ア」や「オ」のように、口を開けすぎたり長く伸ばしたりしやすい音です。",
        draw: {
            jaw: 8,
            protrude: 0,
            rounded: false,
            labelY: 110,
            note: "力を抜いて短く",
            arrow: false,
            tongue: (j) =>
                "M44 " + (116 + j) +
                " C54 96 84 90 112 90 L138 92 L138 " + (98 + j) +
                " L118 " + (108 + j) + " L98 " + (112 + j) + " Z"
        }
    },
    "ow": {
        symbol: "/aʊ/",
        title: "aʊ（around の ou）の音",
        advice: "「ア」の口の形から始め、すぐに唇を丸めて「ウ」の方向へなめらかに動かします。2つの音を切らずに、1つの音として続けて出します。",
        common: "「アウ」と2つに分かれたり、最後の「ウ」が弱くなったりしやすい音です。",
        draw: {
            jaw: 14,
            protrude: 0,
            rounded: false,
            labelY: 126,
            note: "「ア」から唇を丸めて「ウ」へ",
            arrow: true,
            tongue: (j) =>
                "M44 " + (116 + j) +
                " C58 " + (106 + j) + " 84 " + (100 + j) + " 108 " + (98 + j) +
                " L128 " + (100 + j) + " L124 " + (112 + j) +
                " L100 " + (114 + j) + " Z"
        }
    },
    "ei": {
        symbol: "/eɪ/",
        title: "eɪ（lake の a）の音",
        advice: "「エ」から「イ」へなめらかに動かします。「エー」と伸ばしきらず、終わりにかけて舌を少し持ち上げ、口を少しだけ閉じていきます。",
        common: "「エー」と長く伸ばしたままで、「イ」の動きが入らなくなりやすい音です。",
        draw: {
            jaw: 6,
            protrude: 0,
            rounded: false,
            labelY: 108,
            note: "エ → イへなめらかに",
            arrow: false,
            tongue: (j) =>
                "M44 " + (116 + j) +
                " C54 96 80 84 106 78 C124 74 138 74 144 78 L144 " + (88 + j) +
                " L124 " + (100 + j) + " L104 " + (110 + j) + " Z"
        }
    }
};

const targetWords = correctText
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9']/g, ""))
    .filter((word) => word.length > 0);

const normalizedTargets = targetWords.map((word) => normalizeWord(word));

let recognition = null;
let isListening = false;
let resultReceived = false;
let lastError = "";
let voices = [];
let currentAudio = null;

window.addEventListener("error", (event) => {
    statusText.textContent = "プログラムエラー：" + event.message;
});

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function normalizeWord(text) {
    return text.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function normalizeWords(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9'\s]/g, " ")
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
}

function levenshtein(a, b) {
    const dp = [];

    for (let i = 0; i <= a.length; i++) {
        dp.push(new Array(b.length + 1).fill(0));
        dp[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }

    return dp[a.length][b.length];
}

function similarity(a, b) {
    const maxLength = Math.max(a.length, b.length);

    if (maxLength === 0) return 0;

    return 1 - levenshtein(a, b) / maxLength;
}

function alignWords(targets, spoken) {
    const n = targets.length;
    const m = spoken.length;
    const dp = [];

    for (let i = 0; i <= n; i++) {
        dp.push(new Array(m + 1).fill(0));
    }

    for (let i = 1; i <= n; i++) {
        dp[i][0] = i;
    }

    for (let j = 1; j <= m; j++) {
        dp[0][j] = j;
    }

    const subCost = (i, j) => 1 - similarity(targets[i], spoken[j]);

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j - 1] + subCost(i - 1, j - 1),
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1
            );
        }
    }

    const assigned = new Array(n).fill(null);
    const extras = [];
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
        if (
            i > 0 &&
            j > 0 &&
            Math.abs(dp[i][j] - (dp[i - 1][j - 1] + subCost(i - 1, j - 1))) < 1e-9
        ) {
            assigned[i - 1] = spoken[j - 1];
            i--;
            j--;
        } else if (
            i > 0 &&
            Math.abs(dp[i][j] - (dp[i - 1][j] + 1)) < 1e-9
        ) {
            assigned[i - 1] = null;
            i--;
        } else {
            extras.unshift(spoken[j - 1]);
            j--;
        }
    }

    return { assigned: assigned, extras: extras };
}

function evaluateSentence(alternatives) {
    const aligned = alternatives.map((alt) =>
        alignWords(normalizedTargets, normalizeWords(alt.transcript))
    );

    const top = alternatives[0];
    const topConfidence = top.confidence > 0 ? top.confidence : 0.7;

    const words = targetWords.map((word, index) => {
        const target = normalizedTargets[index];
        const heard = aligned[0].assigned[index];

        if (heard === target) {
            return {
                word: word,
                heard: heard,
                score: Math.round(60 + 40 * topConfidence),
                rank: 0
            };
        }

        for (let k = 1; k < alternatives.length; k++) {
            if (aligned[k].assigned[index] === target) {
                return {
                    word: word,
                    heard: heard,
                    score: Math.max(10, 50 - 10 * (k - 1)),
                    rank: k
                };
            }
        }

        if (heard === null) {
            return { word: word, heard: null, score: 0, rank: -1 };
        }

        return {
            word: word,
            heard: heard,
            score: Math.round(40 * similarity(heard, target)),
            rank: -1
        };
    });

    const total = Math.round(
        words.reduce((sum, w) => sum + w.score, 0) / words.length
    );

    return {
        words: words,
        total: total,
        extras: aligned[0].extras
    };
}

function levelText(score) {
    if (score >= 90) return "とても良い発音です！";
    if (score >= 70) return "良い発音です。";
    if (score >= 50) return "もう少しです。";
    return "下のコツを見て、もう一度練習しましょう。";
}

function chipClass(score) {
    if (score >= 80) return "good";
    if (score >= 50) return "mid";
    return "bad";
}

function buildMouthSvg(info) {
    const d = info.draw;
    const j = d.jaw;
    const lipX = 161 + d.protrude;
    const lipRx = d.rounded ? 7 : 9;
    const lipRy = d.rounded ? 10 : 8;

    let svg =
        '<svg class="mouth-svg" viewBox="0 0 200 150" role="img" aria-label="' +
        info.title +
        'の口の中の断面図">' +
        '<rect x="0" y="0" width="200" height="150" rx="12" fill="#fafafa" stroke="#ddd"/>' +
        '<path d="' + d.tongue(j) + '" fill="#f4a6a6" stroke="#c0605f" stroke-width="2"/>' +
        '<path d="M146 52 C130 44 90 36 60 46 C48 50 42 56 40 66 L40 ' + (118 + j) +
        '" fill="none" stroke="#555" stroke-width="3"/>' +
        '<path d="M150 ' + (98 + j) + ' C110 ' + (106 + j) + ' 70 ' + (112 + j) +
        ' 40 ' + (118 + j) + '" fill="none" stroke="#555" stroke-width="3"/>' +
        '<rect x="146" y="52" width="8" height="16" rx="2" fill="#fff" stroke="#555" stroke-width="1.5"/>' +
        '<rect x="146" y="' + (82 + j) + '" width="8" height="16" rx="2" fill="#fff" stroke="#555" stroke-width="1.5"/>' +
        '<ellipse cx="' + lipX + '" cy="57" rx="' + lipRx + '" ry="' + lipRy + '" fill="#e57373"/>' +
        '<ellipse cx="' + lipX + '" cy="' + (90 + j) + '" rx="' + lipRx + '" ry="' + lipRy + '" fill="#e57373"/>' +
        '<text x="70" y="' + d.labelY + '" font-size="12" fill="#7a1f1f">舌</text>';

    if (d.arrow) {
        svg +=
            '<path d="M184 108 L184 84" stroke="#1976d2" stroke-width="2" fill="none"/>' +
            '<path d="M179 90 L184 82 L189 90 Z" fill="#1976d2"/>';
    }

    svg +=
        '<text x="100" y="144" font-size="11" fill="#1976d2" text-anchor="middle">' +
        d.note +
        "</text></svg>";

    return svg;
}

function renderTips(words) {
    const groups = {};
    const order = [];

    words.forEach((item) => {
        if (item.score >= 80) return;

        const info = wordInfo[item.word.toLowerCase()];

        if (!info) return;

        info.sounds.forEach((key) => {
            if (!groups[key]) {
                groups[key] = [];
                order.push(key);
            }

            if (!groups[key].includes(item.word)) {
                groups[key].push(item.word);
            }
        });
    });

    if (order.length === 0) {
        tipsElement.innerHTML =
            "<p>すべての単語が良好でした。改善が必要な音はありません。</p>";
        return;
    }

    let html = '<h2 class="tips-title">改善のポイント</h2>';

    order.forEach((key) => {
        const sound = soundInfo[key];

        if (!sound) return;

        const listenButtons = groups[key]
            .map(
                (word) =>
                    '<button type="button" class="tip-listen" data-word="' +
                    escapeHtml(word) +
                    '">🔊 ' +
                    escapeHtml(word) +
                    "</button>"
            )
            .join("");

        html +=
            '<div class="tip-card">' +
            '<div class="tip-figure">' + buildMouthSvg(sound) + "</div>" +
            '<div class="tip-text">' +
            "<h3>" + sound.symbol + " " + sound.title + "</h3>" +
            "<p>対象の単語（押すとお手本が聞けます）：</p>" +
            "<div>" + listenButtons + "</div>" +
            "<p>" + sound.advice + "</p>" +
            '<p class="common">よくある間違い：' + sound.common + "</p>" +
            "</div></div>";
    });

    tipsElement.innerHTML = html;
}

function renderResult(alternatives) {
    const evaluation = evaluateSentence(alternatives);

    totalScoreElement.textContent =
        "総合スコア：" + evaluation.total + " 点";

    const others = alternatives
        .slice(1)
        .map((alt) => escapeHtml(alt.transcript.trim()))
        .join(" / ");

    const chips = evaluation.words
        .map(
            (item) =>
                '<span class="word-chip ' + chipClass(item.score) + '">' +
                escapeHtml(item.word) + " " + item.score +
                "</span>"
        )
        .join("");

    const issues = [];

    evaluation.words.forEach((item) => {
        if (item.rank === 0) return;

        if (item.heard === null) {
            issues.push(
                "「" + escapeHtml(item.word) + "」は認識されませんでした。"
            );
        } else if (item.rank > 0) {
            issues.push(
                "「" + escapeHtml(item.word) + "」は、別の語に聞こえる可能性がありました（認識の第" +
                (item.rank + 1) + "候補で一致）。"
            );
        } else {
            issues.push(
                "「" + escapeHtml(item.word) + "」は「" +
                escapeHtml(item.heard) + "」と認識されました。"
            );
        }
    });

    if (evaluation.extras.length > 0) {
        issues.push(
            "お手本にない語が認識されました：" +
            escapeHtml(evaluation.extras.join(" "))
        );
    }

    result.innerHTML =
        "<p>認識された文：<strong>" +
        escapeHtml(alternatives[0].transcript.trim()) +
        "</strong></p>" +
        (others ? "<p>他の候補：" + others + "</p>" : "") +
        "<p>単語ごとのスコア（緑：80点以上　黄：50〜79点　赤：49点以下）</p>" +
        '<div class="word-row">' + chips + "</div>" +
        "<p>" + levelText(evaluation.total) + "</p>" +
        (issues.length > 0
            ? '<ul class="issue-list"><li>' + issues.join("</li><li>") + "</li></ul>"
            : "<p>すべての単語がお手本と一致しました。</p>") +
        '<p class="note">採点の目安：お手本と一致すると60〜100点（認識の信頼度で変わります。信頼度は文全体で1つの値です）、第2候補以降で一致すると10〜50点、別の語に聞こえた場合は文字の似ている度合いで0〜40点、認識されなかった場合は0点です。総合スコアは単語ごとのスコアの平均です。音素単位の採点ではなく、あくまで目安です。</p>';

    renderTips(evaluation.words);
}

function setListening(value) {
    isListening = value;
    recordButton.textContent = value ? "⏹ 認識を終了" : "🎤 認識を開始";
}

function clearOutput() {
    result.innerHTML = "";
    tipsElement.innerHTML = "";
    totalScoreElement.textContent = "";
}

function loadVoices() {
    if ("speechSynthesis" in window) {
        voices = window.speechSynthesis.getVoices();
    }
}

function pickEnglishVoice() {
    const normalized = (voice) =>
        (voice.lang || "").toLowerCase().replace("_", "-");

    const us = voices.filter((voice) => normalized(voice).startsWith("en-us"));

    if (us.length > 0) return us[0];

    const english = voices.filter((voice) => normalized(voice).startsWith("en"));

    return english.length > 0 ? english[0] : null;
}

function stopAllSound() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

function speak(text, useFile) {
    if (useFile && SAMPLE_AUDIO_FILE) {
        stopAllSound();
        currentAudio = new Audio(SAMPLE_AUDIO_FILE);
        currentAudio.addEventListener("ended", () => {
            statusText.textContent = "お手本の再生が終わりました。";
        });
        currentAudio.play().catch(() => {
            statusText.textContent =
                "お手本の音声ファイルを再生できませんでした。ファイル名を確認してください。";
        });
        statusText.textContent = "🔊 お手本を再生中です！";
        return;
    }

    if (!("speechSynthesis" in window)) {
        statusText.textContent =
            "このブラウザはお手本の読み上げに対応していません。";
        return;
    }

    stopAllSound();
    loadVoices();

    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = pickEnglishVoice();

        utterance.lang = "en-US";

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        }

        utterance.rate = 0.85;

        utterance.onend = () => {
            statusText.textContent = "お手本の再生が終わりました。";
        };

        utterance.onerror = () => {
            statusText.textContent = "お手本を再生できませんでした。";
        };

        window.speechSynthesis.speak(utterance);

        statusText.textContent = voice
            ? "🔊 お手本を再生中です！"
            : "🔊 再生中です（端末に英語の音声が見つからないため、日本語の音声で読まれる可能性があります）";
    }, 150);
}

function startRecognition() {
    if (!SpeechRecognitionClass) {
        statusText.textContent =
            "このブラウザは音声認識に対応していません。Chromeで開いてください。";
        return;
    }

    stopAllSound();
    clearOutput();
    resultReceived = false;
    lastError = "";

    setTimeout(() => {
        recognition = new SpeechRecognitionClass();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => {
            setListening(true);
            statusText.textContent =
                "🔴 認識中です。文全体を話してください！";
        };

        recognition.onspeechstart = () => {
            statusText.textContent =
                "🔴 音声を検出しました。話し終わると結果が出ます。";
        };

        recognition.onresult = (event) => {
            const list = event.results[0];
            const alternatives = [];

            for (let k = 0; k < list.length; k++) {
                alternatives.push({
                    transcript: list[k].transcript,
                    confidence: list[k].confidence
                });
            }

            if (alternatives.length === 0) return;

            resultReceived = true;
            renderResult(alternatives);
        };

        recognition.onerror = (event) => {
            lastError = event.error;
        };

        recognition.onend = () => {
            setListening(false);

            if (resultReceived) {
                statusText.textContent =
                    "結果を表示しました。もう一度練習できます。";
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
            statusText.textContent =
                "音声認識を開始できませんでした：" + error.message;
            console.error(error);
        }
    }, 250);
}

if ("speechSynthesis" in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
}

sampleButton.addEventListener("click", () => {
    speak(correctText, true);
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

tipsElement.addEventListener("click", (event) => {
    const button = event.target.closest(".tip-listen");

    if (!button) return;

    speak(button.dataset.word, false);
});

retryButton.addEventListener("click", () => {
    if (isListening) {
        statusText.textContent = "先に認識を終了してください。";
        return;
    }

    stopAllSound();
    clearOutput();
    statusText.textContent = "認識待機中（版" + VERSION + "）";
});

statusText.textContent = "認識待機中（版" + VERSION + "）";
