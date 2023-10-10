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
  PRE_PROMPT = prompt;
  insertQuestion(prompt);
//   HINT_HTML = "";
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
    let time = 0;
    insertPrePromptAgain();
    removeStop();

    const interval = setInterval(() => {
      time++;
      if (HINT_HTML) {
        const hint = g("hint");
        if (hint) {
          hint.remove();
        }
        insertHint();
        clearInterval(interval);
      } else {
        if (time === 100) {
          clearInterval(interval);
        }
      }
    }, 100);
    return;
  }
  const card = g(CHAT_ID);
  if (card) {
    card.innerText += answer;
  } else {
    let html = `<div class="card answer">${answer}</div>`;
    content.insertAdjacentHTML("beforeend", html);
  }
  scorllToBottom();
}

function insertQuestion(question) {
  const hint = g("hint");
  const again = g("again");
  if (hint) {
    hint.remove();
  }
  if (again) {
    again.remove();
  }
  let html = `<div class="card question">${question}</div>`;
  content.insertAdjacentHTML("beforeend", html);
  scorllToBottom();
}

function insertPrePromptAgain() {
  let html = `
        <div id="again">
            <img src="static/img/again.png" alt="" />
            <span>もう一度聞く</span>
        </div>
    `;
  content.insertAdjacentHTML("beforeend", html);
  scorllToBottom();
  g("again").addEventListener("click", (e) => {
    temperature *= 2;
    if (temperature >= 2) {
      temperature = 2;
    }
    sendPrompt(PRE_PROMPT);
  });
}

function insertHint() {
  if (HINT_HTML) {
    content.insertAdjacentHTML("beforeend", HINT_HTML);
    HINT_HTML = "";
    document.querySelectorAll("#hint .hint-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const text = e.target.dataset.text;
        sendPrompt(text);
        if (g("hint")) {
          g("hint").remove();
        }
      });
    });
    scorllToBottom();
  }
}

function receiveHintResponse(arr) {
  try {
    if (arr && arr.length) {
      const hintItem = arr
        .map((item) => {
          return `<div data-text="${item}" title="${item}" class="hint-item">${item}</div>`;
        })
        .join("");

      HINT_HTML = `
            <div class="hint-list" id="hint">
                ${hintItem}
                <div class="tips">質問候補を表示しています</div>
            </div>         
            `;
    }
  } catch (error) {
    console.error(error);
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

// DEFINE EVENT HANDLERS
tip.addEventListener("click", (e) => {
  chatBody.style.display = "flex";
  mockChatBody.style.display = "none";
  tip.style.display = "none";
  close.style.display = "initial";
  header.style.height = "88px";
  keyword.focus();
  try {
    window.parent.postMessage("open", "*");
  } catch (error) {
    console.error(error);
  }
});

close.addEventListener("click", (e) => {
  chatBody.style.display = "none";
  mockChatBody.style.display = "block";
  tip.style.display = "block";
  close.style.display = "none";
  header.style.height = "130px";
  try {
    window.parent.postMessage("close", "*");
  } catch (error) {
    console.error(error);
  }
});

keyword.addEventListener("keydown", (e) => {
  const count = keyword.value.length;
  g("count").innerText = count;
  if (e.keyCode == 13) {
    const prompt = keyword.value.trim();
    if (prompt.length > OPENAI_PROMPT_MAX_LENGTH) {
      alert("質問は200文字以内でお願いします。");
    } else {
      temperature = 0.2
      sendPrompt(prompt);
    }
  }
});