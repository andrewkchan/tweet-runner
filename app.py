from flask import Flask, render_template, jsonify, request
from flask.ext.socketio import SocketIO, emit

import tweepy
import time
import json
import threading
import random

app = Flask(__name__)

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

keywords = ['berkeley', 'stanford', 'midterm', 'acorn', 'lawnmower', 'fox news', 'usc']

#Routes----------------------------------------------------

@app.route("/")
def index():
    #return get_tweets()
    return render_template("index.html")

@app.route("/query-tweet-stream")
def get():
    tweets = {'tweets': json_cache.copy()}
    json_cache.clear()
    return json.dumps(tweets)

@app.route('/request/', methods=['GET'])
def echo():
    #ret_data = {"value": request.args.get('echoValue')}
    return get()
 
#@app.route("/your/webservice")
#def my_webservice():
#    return jsonify(result=some_function(**request.args))

#------------------------------------------------------------
#Websocket messages------------------------------------------

@socketio.on('my event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']})

@socketio.on('my broadcast event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']}, broadcast=True)

@socketio.on('connect', namespace='/test')
def test_connect():
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')

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
thread = threading.Thread(target=myStream.filter, kwargs={'track': keywords})
thread.start()

if __name__=="__main__":
    #app.run(host="0.0.0.0", threaded=True)
    socketio.run(app, host="0.0.0.0")