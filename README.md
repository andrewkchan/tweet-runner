# TweetRunner

An endless runner game in which enemies spawn based on Twitter activity around the world at that moment. Built using Python (Flask) and JS.

Demo here:

<http://spooky-broomstick-5831.herokuapp.com/>

## Installation

1. Install pip and virtualenv.
2. `virtualenv venv`
3. `source venv/bin/activate` or `venv\scripts\activate` if you're on windows.
4. `pip install -r requirements.txt`.
5. `gunicorn -k gevent -w 1 app:app` to run the production server. Otherwise, `python app.py` will run the Werkzeug dev server.

## Developers

* **Andrew Chan**
<https://github.com/theandrewchan>
* **Brian Levis**
<https://github.com/brianlevis>
* **Arianna Ninh**
<https://github.com/ninhja>
