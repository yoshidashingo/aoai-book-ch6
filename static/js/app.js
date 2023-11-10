const form = g('form');
const keyword = g('keyword');
const content = g('content');
const submit = g('submit');
const stop = g('stop');
let temperature = 0.5;
let resetTemperatureFlag = true;
let previousPrompt = '';
let source;

let CHAT_ID;

function g(id) {
    return document.getElementById(id);
}

function reset() {
    previousPrompt = keyword.value || previousPrompt;
    keyword.value = '';
    keyword.disabled = false;
    keyword.focus();
    toggleSubmitAndStop();
}

function resetTemperature() {
    temperature = 0.5;
}

function scorllToBottom() {
    content.scrollTo(0, content.scrollHeight);
}

function appendDisclaimer() {
    const dom = `
    <div class="disclaimer">
        この回答は「sample.pdf」の内容を参照して作成しています。【←データの透明性】 <br/>
        このアプリで生成される情報は不正確または不適切な場合がありますが、当社の見解を述べるものではありません。【←注意書き】
    </div>    
    `
    content.insertAdjacentHTML("beforeend", dom);
}

function insertThumbs(id) {
    const card = g(id);
    const dom = `
        <div class="thumbs">
            <span class="thumb-up">👍</span>
            <span class="thumb-down">👎</span>
        </div>
    `
    card.insertAdjacentHTML("beforeend", dom)
}

function insertOnceAgain() {
    const dom = `
        <div id="onceAgain" class="once-again">もう一度聞く</div>    
    `;
    content.insertAdjacentHTML("beforeend", dom)
    const onceAgain = g('onceAgain');

    onceAgain.addEventListener('click', e => {
        temperature += 0.5
        if (temperature > 2.0) {
            resetTemperature();
        }
        resetTemperatureFlag = false;
        onSubmit();
    });
}

function insertPending() {
    const dom = `
        <div class="pending" id="pending"></div>
    `;
    content.insertAdjacentHTML("beforeend", dom)
}

function toggleSubmitAndStop() {
    const submitDisplay = submit.style.display;
    if (submitDisplay === 'none') {
        submit.style.display = 'flex';
        stop.style.display = 'none';
    } else {
        submit.style.display = 'none';
        stop.style.display = 'flex';
    }
}

function onSubmit(event) {
    if (event) {
        event.preventDefault();
    }
    const onceAgain = g('onceAgain');
    if (onceAgain) {
        onceAgain.remove();
    }

    let isResetTemperature = true;
    if (resetTemperatureFlag === false) {
        isResetTemperature = false
    }
    if (isResetTemperature) {
        resetTemperature();
    }

    const prompt = keyword.value || previousPrompt;
    if (!prompt.trim()) {
        return;
    }
    keyword.disabled = true;
    CHAT_ID = Date.now();
    updateDOM('user', prompt);
    insertPending();
    invokeAPI(prompt)
    toggleSubmitAndStop();
    return false;
}

function invokeAPI(prompt) {
    source = new EventSource(`/chat?prompt=${prompt}&temperature=${temperature}`);
    source.onmessage = function (event) {
        const pending = g('pending');
        if (pending) {
            pending.remove();
        }

        if (event.data === "[DONE]") {
            source.close();
        }
        updateDOM('ai', event.data);
    };
}

function updateDOM(type, text) {
    let html = '';
    if (type === 'user') {
        html = `<div class="card question">${text}</div>`;
    } else if (type === 'ai' && text !== '[DONE]') {
        const card = g(CHAT_ID);
        if (card) {
            card.innerText += text.replaceAll('[NEWLINE]', '\n');
        } else {
            html = `<div class="card answer" id="${CHAT_ID}">${text}</div>`;
        }
    } else if (text === '[DONE]') {
        appendDisclaimer();
        insertThumbs(CHAT_ID);
        insertOnceAgain();
        scorllToBottom();
        reset();
        return;
    }
    content.insertAdjacentHTML("beforeend", html);
    scorllToBottom();
}

form.addEventListener('submit', onSubmit);

submit.addEventListener('click', e => {
    if (keyword.value) {
        onSubmit(e);
    }
});

stop.addEventListener('click', e => {
    source.close();
    reset();
});