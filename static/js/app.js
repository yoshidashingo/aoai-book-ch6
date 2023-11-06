const form = g('form');
const keyword = g('keyword');
const content = g('content');
let CHAT_ID;
let DONE = false;
let INTERVAL_MS = 33;
let interval;
let queue = [];

function g(id) {
    return document.getElementById(id);
}

function reset() {
    keyword.value = '';
}

function scorllToBottom() {
    content.scrollTo(0, content.scrollHeight);
}

function onSubmit(event) {
    event.preventDefault();
    const prompt = keyword.value;
    CHAT_ID = Date.now();
    updateDOM('user', prompt);
    invokeAPI(keyword.value)
    reset();
    return false;
}

function invokeAPI(prompt) {
    source = new EventSource(`/chat?prompt=${prompt}`);
    source.onmessage = function (event) {
        if (event.data === "[DONE]") {
            source.close();
        }
        insertAnswer(event.data);
    };
    interval = setInterval(() => {
        const text = queue.shift();
        if (text) {
            updateDOM('ai', text);
        }
        if (DONE === true && queue.length === 0) {
            clearInterval(interval);
            DONE = false;
        }
    }, INTERVAL_MS);
}

function insertAnswer(data) {
    if (data === '[DONE]') {
        DONE = true;
    } else {
        queue.push(data)
    }
}

function updateDOM(type, text) {
    let html = '';
    if (type === 'user') {
        html = `<div class="card question">${text}</div>`;
    } else if (type === 'ai') {
        const card = g(CHAT_ID);
        if (card) {
            card.innerText += text;
        } else {
            html = `<div class="card answer" id="${CHAT_ID}">${text}</div>`;
        }
    }
    content.insertAdjacentHTML("beforeend", html);
    scorllToBottom();
}

form.addEventListener('submit', onSubmit);