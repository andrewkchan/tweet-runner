from flask import Flask, render_template, jsonify, request, send_from_directory
from flask.ext.socketio import SocketIO, emit

import tweepy
import time
import json
import threading
import random

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = 'uploaded_assets'

socketio = SocketIO(app)
 
consumer_key = 'Otz5rylmpLoBFBbjAiLgTay1J'
consumer_secret = 'vDmqWCcCaqrybtkho6hehZJLQkTdiFvHvBSLm5TgsrtMq49RYK'
access_token = '4074485474-giyYlpDuuIwyB690amWHIkAyij0WHAhfvr0O54b'
access_token_secret = 'hDESXlh1qUwFifGYv2ukfhVaYRWNE7zHrb4jSKZXFUiRJ'

def use_other_keys():
    global consumer_key, consumer_secret, access_token, access_token_secret
    consumer_key = "Fss3DMcf9sw7lkaddUGlo8sN2"
    consumer_secret = "SxvXVyQAHIgwjjcTcC9BDgYHppZmc4qiYCkwwBg9jf9Whe916g"
    access_token = "4065144794-pqAghjRqGZRT4ETGcGjxj4OUc9rwtx772aSANqp"
    access_token_secret = "UBXUjvm8rkepFkrJZZUQyVH8grUYK5cKnp5olpsVWSiC2"
 
auth = tweepy.OAuthHandler(consumer_key, consumer_secret)
auth.set_access_token(access_token, access_token_secret)
 
api = tweepy.API(auth)
 
json_cache = []
last = ['']

keywords = ['acorn', 'stanford', 'midterm', 'lawnmower', 'fox news', 'usc']

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
'''
@socketio.on('my event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']})

@socketio.on('my broadcast event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']}, broadcast=True)
'''
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
 
def process(data):
    keyword = False
    for k in keywords:
        if k in data['text'].lower():
            keyword = k
    if not keyword or data['user']['lang'] != 'en' or last[0] == data['text']:
        return
    last[0] = data['text']
    tweet = {'name': data['user']['screen_name'], 
            'text': data['text'], 
            'url': 'https://twitter.com/statuses/' + str(data['id']), 
            'time': data['created_at'], 
            'favorites': data['favorite_count'], 
            'retweets': data['retweet_count'], 
            'keyword': keyword}
    print(tweet['time'])
    print('@%s: %s' % (data['user']['screen_name'], data['text'].encode('ascii', 'ignore')))
    #broadcast the tweet to all connected clients
    socketio.emit('new_tweet', tweet)
   
class MyStreamListener(tweepy.StreamListener):
    def on_data(self, data):
        process(json.loads(data))
        return True
 
    def on_error(self, status):
        print(status)
        use_other_keys()
 
myStreamListener = MyStreamListener()
myStream = tweepy.Stream(auth = api.auth, listener=myStreamListener)


if __name__=="__main__":
    #app.run(host="0.0.0.0", threaded=True)
    thread = threading.Thread(target=myStream.filter, kwargs={'track': keywords})
    thread.start()
    socketio.run(app, host="0.0.0.0")