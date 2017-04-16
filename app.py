from flask import Flask, render_template, jsonify, request, send_from_directory
from flask.ext.socketio import SocketIO, emit

import json
import threading
from config import *
from src.streamworker import StreamWorker

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = 'uploaded_assets'
socketio = SocketIO(app)


entities = {'stanford': {'type': 'enemy', 'imageURL': 'enemy1.png', 'velocity': '0', 'gravity': 'no', 'startingHeight': '0'},
            'midterm': {'type': 'enemy', 'imageURL': 'failure.png', 'velocity': '0', 'gravity': 'no', 'startingHeight': '0'},
            'lawnmower': {'type': 'enemy', 'imageURL': 'lawnmower.png', 'velocity': '-100', 'gravity': 'no', 'startingHeight': '0'},
            'fox news': {'type': 'enemy', 'imageURL': 'foxnews.png', 'velocity': '0', 'gravity': 'no', 'startingHeight': '0'},
            'usc': {'type': 'enemy', 'imageURL': 'trojan.png', 'velocity': '0', 'gravity': 'no', 'startingHeight': '0'}}


#Routes----------------------------------------------------

@app.route("/")
def index():
    #return get_tweets()
    return render_template("index.html")

@app.route("/images/<filename>")
def get_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

#------------------------------------------------------------
#Websocket messages------------------------------------------
@socketio.on('connect')
def test_connect():
    print("CLIENT CONNECTED")
    emit('transmit_entities', entities)

@socketio.on("version_verification")
def print_client_version(message):
    print("client version:" + message["version"])

@socketio.on('disconnect')
def test_disconnect():
    print('CLIENT DISCONNECTED')

@socketio.on("entites_received")
def entities_received():
    print("CLIENT RECEIVED ENTITIES")

#------------------------------------------------------------

if __name__=="__main__":
    config = {
        "consumer_key": consumer_key,
        "consumer_secret": consumer_secret,
        "access_token": access_token,
        "access_token_secret": access_token_secret,
        "keywords": ['acorn', 'stanford', 'midterm', 'lawnmower', 'fox news', 'usc'],
        "languages": ["en"]
    }
    print(config)
    streamWorker = StreamWorker(config, socketio)
    main_thread = threading.Thread(target=streamWorker.run)
    main_thread.start()
    socketio.run(app, host="0.0.0.0")
