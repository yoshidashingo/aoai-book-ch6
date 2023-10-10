let source;
// DEFINE HELPER FUNCTIONS
function g(id) {
  return document.getElementById(id);
}

function replaceURLWithHTMLLinks(text) {
  var exp =
    /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
  return text.replace(exp, "<a target=\"_blank\" href='$1'>$1</a>");
}

function sendPrompt(prompt) {
  keyword.value = "";
  keyword.placeholder = "処理中...";
  keyword.disabled = true;
  source = new EventSource(`/chat?prompt=${prompt}`);
  source.onmessage = function (event) {
    if (event.data === "[DONE]") {
      source.close();
    }
    insertAnswer(event.data, prompt);
  };
}

function insertAnswer(answer, prompt) {
  if (answer === "[DONE]") {
    reset();
    g(CHAT_ID).innerHTML = replaceURLWithHTMLLinks(g(CHAT_ID).innerHTML);
    return;
  }
  const card = g(CHAT_ID);
  if (card) {
    card.innerText += answer;
  } else {
    let html = `<div class="card answer">${answer}</div>`;
    content.insertAdjacentHTML("beforeend", html);
    response.insertAdjacentHTML("beforeend", html);
  }
}



// DEFINE DOM ELEMENTS
const response = g("response");
const content = g("content");
const keyword = g("keyword");
const header = g("header");
const tip = g("tip");
const close = g("close");
const mockChatBody = g("mock-chat-body");
const chatBody = g("chat-body");

keyword.addEventListener("keydown", (e) => {
  if (e.keyCode == 13) {
    const prompt = keyword.value.trim();
    if (prompt) {
      sendPrompt(prompt);
    }
  }
});