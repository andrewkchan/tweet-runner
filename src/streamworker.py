from twitter import Api

class StreamWorker:
    config = {}
    api = None
    socketio = None
    
    def __init__(self, config, socketio):
        self.config = config
        self.api = Api(
            config["consumer_key"],
            config["consumer_secret"],
            config["access_token"],
            config["access_token_secret"]
        )
        self.socketio = socketio
    def run(self):
        for data in self.api.GetStreamFilter(track=self.config["keywords"], languages=self.config["languages"]):
            self.process(data)
    def process(self, data):
        keyword = None
        for k in self.config["keywords"]:
            if k in data["text"].lower():
                keyword = k
        if not keyword or data["user"]["lang"] != "en":
            return
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
        self.socketio.emit('new_tweet', tweet)
