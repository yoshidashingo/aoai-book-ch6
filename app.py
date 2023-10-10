from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import (
    HumanMessage,
    SystemMessage
)

from queue import Queue
import flask
import os
import threading
import json
import openai

load_dotenv()
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat')
def chat():
    queue_obj = Queue()
    prompt = request.args.get("prompt")

    def askQuestion():
        class StreamCallbackHandler(BaseCallbackHandler):
            def on_llm_new_token(self, token: str, **kwargs):
                queue_obj.put(token)
            def on_llm_end(self, response, **kwargs):
                queue_obj.put('[DONE]')

        chat = ChatOpenAI(model=os.getenv('OPENAI_API_MODEL'), 
                        streaming=True,
                        temperature=os.getenv('OPENAI_TEMPERATURE'), 
                        callbacks=[StreamCallbackHandler()], 
                        model_kwargs={"deployment_id":os.getenv('AZURE_DEPLOYMENT_ID')}
                        )

        messages = [
            SystemMessage(content="")
        ]

        messages.append(HumanMessage(content=prompt))
        chat(messages)

    def stream():
        str = ''
        while (True):
            chunk = queue_obj.get()
            if chunk:
                if chunk == '[DONE]':
                    yield 'data: %s\n\n' % '[DONE]'
                    break
                else:
                    str += chunk
                    yield 'data: %s\n\n' % chunk
    threading.Thread(target=askQuestion).start()
    return flask.Response(stream(), mimetype='text/event-stream')

if __name__ == "__main__":
    app.run()