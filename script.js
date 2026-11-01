const phraseElement = document.getElementById("phrase");
const wordListElement = document.getElementById("wordList");
const currentInfo = document.getElementById("currentInfo");
const result = document.getElementById("result");
const tipsElement = document.getElementById("tips");
const totalScoreElement = document.getElementById("totalScore");
const statusText = document.getElementById("status");
const sampleButton = document.getElementById("sampleButton");
const phraseSampleButton = document.getElementById("phraseSampleButton");
const recordButton = document.getElementById("recordButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
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

const displayWords = correctText
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9']/g, ""))
    .filter((word) => word.length > 0);

const scores = new Array(displayWords.length).fill(null);

let currentIndex = 0;
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

function normalizeWord(text) {
    return text.toLowerCase().replace(/[^a-z0-9']/g, "");
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

function evaluate(target, alternatives) {
    const normalizedTarget = normalizeWord(target);
    let matchedRank = -1;

    for (let k = 0; k < alternatives.length; k++) {
        if (normalizeWord(alternatives[k].transcript) === normalizedTarget) {
            matchedRank = k;
            break;
        }
    }

    const top = alternatives[0];

    if (matchedRank === 0) {
        const confidence = top.confidence > 0 ? top.confidence : 0.7;
        return {
            score: Math.round(60 + 40 * confidence),
            matchedRank: 0,
            confidence: top.confidence
        };
    }

    if (matchedRank > 0) {
        return {
            score: Math.max(10, 50 - 10 * (matchedRank - 1)),
            matchedRank: matchedRank,
            confidence: alternatives[matchedRank].confidence
        };
    }

    const heard = normalizeWord(top.transcript);
    const maxLength = Math.max(heard.length, normalizedTarget.length);
    const similarity =
        maxLength === 0
            ? 0
            : 1 - levenshtein(heard, normalizedTarget) / maxLength;

    return {
        score: Math.round(40 * Math.max(0, similarity)),
        matchedRank: -1,
        confidence: top.confidence
    };
}

function levelText(score) {
    if (score >= 90) return "とても良い発音です！";
    if (score >= 70) return "良い発音です。";
    if (score >= 50) return "もう少しです。";
    return "下のコツを見て、もう一度練習しましょう。";
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

function renderTips(index, score) {
    const word = displayWords[index];
    const info = wordInfo[word.toLowerCase()];

    if (!info) {
        tipsElement.innerHTML = "";
        return;
    }

    let html =
        '<h2 class="tips-title">' +
        (score < 80 ? "改善のポイント" : "さらに良くするコツ") +
        "：" +
        escapeHtml(word) +
        " " +
        info.ipa +
        "</h2>";

    info.sounds.forEach((key) => {
        const sound = soundInfo[key];

        if (!sound) return;

        html +=
            '<div class="tip-card">' +
            '<div class="tip-figure">' + buildMouthSvg(sound) + "</div>" +
            '<div class="tip-text">' +
            "<h3>" + sound.symbol + " " + sound.title + "</h3>" +
            "<p>" + sound.advice + "</p>" +
            '<p class="common">よくある間違い：' + sound.common + "</p>" +
            "</div></div>";
    });

    tipsElement.innerHTML = html;
}

function renderWordList() {
    wordListElement.innerHTML = "";

    displayWords.forEach((word, index) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "word-chip";

        if (index === currentIndex) {
            chip.classList.add("current");
        }

        const score = scores[index];

        if (score !== null) {
            if (score >= 80) {
                chip.classList.add("good");
            } else if (score >= 50) {
                chip.classList.add("mid");
            } else {
                chip.classList.add("bad");
            }
        }

        chip.textContent = score === null ? word : word + " " + score;

        chip.addEventListener("click", () => {
            selectWord(index);
        });

        wordListElement.appendChild(chip);
    });
}

function renderCurrentInfo() {
    const word = displayWords[currentIndex];
    const info = wordInfo[word.toLowerCase()];

    currentInfo.innerHTML =
        '<span class="current-word">' + escapeHtml(word) + "</span>" +
        (info ? '<span class="ipa">' + info.ipa + "</span>" : "") +
        '<span class="progress-text">' +
        (currentIndex + 1) + " / " + displayWords.length + " 語目</span>";

    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === displayWords.length - 1;
}

function renderTotalScore() {
    const done = scores.filter((s) => s !== null);

    if (done.length === 0) {
        totalScoreElement.textContent = "";
        return;
    }

    const total = Math.round(
        done.reduce((sum, s) => sum + s, 0) / done.length
    );

    totalScoreElement.textContent =
        "総合スコア：" + total + " 点（" +
        done.length + " / " + displayWords.length + " 語を練習済み）";
}

function selectWord(index) {
    if (isListening) {
        statusText.textContent = "先に認識を終了してください。";
        return;
    }

    currentIndex = index;
    result.innerHTML = "";
    tipsElement.innerHTML = "";
    statusText.textContent = "認識待機中";
    renderWordList();
    renderCurrentInfo();
}

function setListening(value) {
    isListening = value;
    recordButton.textContent = value
        ? "⏹ 認識を終了"
        : "🎤 この単語を認識";
}

function handleResult(alternatives) {
    const word = displayWords[currentIndex];
    const evaluation = evaluate(word, alternatives);

    scores[currentIndex] = evaluation.score;

    const others = alternatives
        .slice(1)
        .map((a) => escapeHtml(a.transcript.trim()))
        .join(" / ");

    result.innerHTML =
        "<p>認識された語：<strong>" +
        escapeHtml(alternatives[0].transcript.trim()) +
        "</strong></p>" +
        (others ? "<p>他の候補：" + others + "</p>" : "") +
        '<p class="score-line">' + escapeHtml(word) +
        " のスコア：<span class=\"score-number\">" +
        evaluation.score +
        "</span> 点</p><p>" +
        levelText(evaluation.score) +
        "</p>" +
        '<p class="note">採点の目安：お手本と一致すると60〜100点（認識の信頼度で変わります）、2番目以降の候補に一致すると10〜50点、一致しない場合は文字の似ている度合いで0〜40点です。音素単位の採点ではなく、あくまで目安です。</p>';

    renderTips(currentIndex, evaluation.score);
    renderWordList();
    renderTotalScore();
}

function startRecognition() {
    if (!SpeechRecognitionClass) {
        statusText.textContent =
            "このブラウザは音声認識に対応していません。Chromeで開いてください。";
        return;
    }

    result.innerHTML = "";
    tipsElement.innerHTML = "";
    resultReceived = false;
    lastError = "";

    recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
        setListening(true);
        statusText.textContent =
            "🔴 認識中です。「" + displayWords[currentIndex] + "」と話してください！";
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
        handleResult(alternatives);
    };

    recognition.onerror = (event) => {
        lastError = event.error;
    };

    recognition.onend = () => {
        setListening(false);

        if (resultReceived) {
            statusText.textContent =
                "結果を表示しました。もう一度認識するか、次の単語へ進めます。";
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

function speak(text) {
    if (!("speechSynthesis" in window)) {
        statusText.textContent =
            "このブラウザはお手本の読み上げに対応していません。";
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    statusText.textContent = "🔊 お手本を再生中です！";
}

sampleButton.addEventListener("click", () => {
    speak(displayWords[currentIndex]);
});

phraseSampleButton.addEventListener("click", () => {
    speak(correctText);
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

prevButton.addEventListener("click", () => {
    if (currentIndex > 0) {
        selectWord(currentIndex - 1);
    }
});

nextButton.addEventListener("click", () => {
    if (currentIndex < displayWords.length - 1) {
        selectWord(currentIndex + 1);
    }
});

retryButton.addEventListener("click", () => {
    if (isListening) {
        statusText.textContent = "先に認識を終了してください。";
        return;
    }

    for (let i = 0; i < scores.length; i++) {
        scores[i] = null;
    }

    currentIndex = 0;
    result.innerHTML = "";
    tipsElement.innerHTML = "";
    statusText.textContent = "認識待機中";
    renderWordList();
    renderCurrentInfo();
    renderTotalScore();
});

renderWordList();
renderCurrentInfo();
renderTotalScore();
