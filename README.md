# ELO

## Installation

These instructions were written while testing against Ubuntu 20.04.

However, most of the development was done on a Debian image, so hopefully you can get things running
on your preferred distro without too much trouble.

**Dependencies**
- Docker (`sudo apt install docker.io`)
- NodeJS (Install [nvm](https://github.com/nvm-sh/nvm), `nvm i 16`)

**Steps**

1. `npm install`
2. `cp config.example.json config.json` making appropriate updates (needed for production)
3. `npm run build`
4. Place your model at data/models.tflite (e.g. public [English model](https://github.com/coqui-ai/STT-models/releases/download/english/coqui/v0.9.3/model.tflite))
5. `sudo docker build . -t elo-server` (~4min) (Note 2) 
6. `sudo docker run --rm -it -p36582:36582 elo-server:latest`

Visit `localhost:36582/demo.html` to view the demo frontend.

The extension is located at `build/extension`. (See
[here](https://developer.chrome.com/docs/extensions/mv3/getstarted/) for loading locally and
[here](https://developer.chrome.com/docs/webstore/publish/) for advice on publishing.)

## Using the API Directly

POST your audio file to `http://localhost:36582/analyze`.

E.g.:
```
$ curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/audio-0.9.3.tar.gz
$ tar xf audio-0.9.3.tar.gz
$ curl -X POST --data-binary @audio/2830-3980-0043.wav http://localhost:36582/analyze
{"type": "token", "value": {"text": "e", "start_time": 0.6800000071525574}}
{"type": "token", "value": {"text": "x", "start_time": 0.7199999690055847}}
{"type": "token", "value": {"text": "p", "start_time": 0.7999999523162842}}
{"type": "token", "value": {"text": "e", "start_time": 0.8199999928474426}}
{"type": "token", "value": {"text": "r", "start_time": 0.85999995470047}}
{"type": "token", "value": {"text": "i", "start_time": 0.8999999761581421}}
{"type": "token", "value": {"text": "e", "start_time": 0.9399999976158142}}
{"type": "token", "value": {"text": "n", "start_time": 0.9799999594688416}}
{"type": "token", "value": {"text": "c", "start_time": 1.0}}
{"type": "token", "value": {"text": "e", "start_time": 1.0399999618530273}}
{"type": "token", "value": {"text": " ", "start_time": 1.1200000047683716}}
{"type": "word", "value": {"start_time": 0.6800000071525574, "end_time": 1.0399999618530273, "disfluent": false, "text": "experience"}}
{"type": "token", "value": {"text": "p", "start_time": 1.2200000286102295}}
{"type": "token", "value": {"text": "r", "start_time": 1.2599999904632568}}
{"type": "token", "value": {"text": "o", "start_time": 1.2799999713897705}}
{"type": "token", "value": {"text": "v", "start_time": 1.3199999332427979}}
{"type": "token", "value": {"text": "e", "start_time": 1.3399999141693115}}
{"type": "token", "value": {"text": "s", "start_time": 1.3799999952316284}}
{"type": "token", "value": {"text": " ", "start_time": 1.4399999380111694}}
{"type": "word", "value": {"start_time": 1.2200000286102295, "end_time": 1.3799999952316284, "disfluent": false, "text": "proves"}}
{"type": "token", "value": {"text": "t", "start_time": 1.5}}
{"type": "token", "value": {"text": "h", "start_time": 1.5199999809265137}}
{"type": "token", "value": {"text": "i", "start_time": 1.5399999618530273}}
{"type": "token", "value": {"text": "s", "start_time": 1.5799999237060547}}
{"type": "token", "value": {"text": "s", "start_time": 1.6999999284744263}}
{"type": "word", "value": {"start_time": 1.5, "end_time": 1.6999999284744263, "disfluent": false, "text": "thiss"}}
{"type": "end", "value": {"duration": 1.9774375}}
```

## Using the Python CLI

```
$ cd analyzer
$ python3 -m venv venv
$ source venv/bin/activate
$ pip install -U pip
$ pip install -r requirements.txt
$ curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/audio-0.9.3.tar.gz
$ tar xf audio-0.9.3.tar.gz
$ python cli.py "proves this" <audio/2830-3980-0043.wav

(a bunch of stderr output from deepspeech, e.g. describing missing gpu)

{"type": "token", "value": {"text": "e", "start_time": 0.6800000071525574}}
{"type": "token", "value": {"text": "x", "start_time": 0.7199999690055847}}
{"type": "token", "value": {"text": "p", "start_time": 0.7999999523162842}}
{"type": "token", "value": {"text": "e", "start_time": 0.8199999928474426}}
{"type": "token", "value": {"text": "r", "start_time": 0.85999995470047}}
{"type": "token", "value": {"text": "i", "start_time": 0.8999999761581421}}
{"type": "token", "value": {"text": "e", "start_time": 0.9399999976158142}}
{"type": "token", "value": {"text": "n", "start_time": 0.9799999594688416}}
{"type": "token", "value": {"text": "c", "start_time": 1.0}}
{"type": "token", "value": {"text": "e", "start_time": 1.0399999618530273}}
{"type": "token", "value": {"text": " ", "start_time": 1.1200000047683716}}
{"type": "word", "value": {"start_time": 0.6800000071525574, "end_time": 1.0399999618530273, "disfluent": false, "text": "experience"}}
{"type": "token", "value": {"text": "p", "start_time": 1.2200000286102295}}
{"type": "token", "value": {"text": "r", "start_time": 1.2400000095367432}}
{"type": "token", "value": {"text": "o", "start_time": 1.2799999713897705}}
{"type": "token", "value": {"text": "o", "start_time": 1.3199999332427979}}
{"type": "token", "value": {"text": "e", "start_time": 1.3399999141693115}}
{"type": "token", "value": {"text": "s", "start_time": 1.3799999952316284}}
{"type": "token", "value": {"text": " ", "start_time": 1.4399999380111694}}
{"type": "word", "value": {"start_time": 1.2200000286102295, "end_time": 1.3799999952316284, "disfluent": false, "text": "prooes"}}
{"type": "token", "value": {"text": "t", "start_time": 1.5}}
{"type": "token", "value": {"text": "h", "start_time": 1.5199999809265137}}
{"type": "token", "value": {"text": "i", "start_time": 1.5399999618530273}}
{"type": "token", "value": {"text": "s", "start_time": 1.5999999046325684}}
{"type": "token", "value": {"text": "s", "start_time": 1.6999999284744263}}
{"type": "word", "value": {"start_time": 1.5, "end_time": 1.6999999284744263, "disfluent": false, "text": "thiss"}}
{"type": "end", "value": {"duration": 1.976375}}
```

## Notes

- If this is running remotely, you need to configure access to that port, which depends on your
server infrastructure. It's entirely possible that this doesn't need to be exposed to the public
internet - you can use the api by POSTing your audio file to `/analyze`.
  - (For development, I use VS Code's remote-ssh plugin which provides secure port forwarding
    functionality.)
- The frontend has been included, which isn't actually necessary. I'm not sure it makes much
difference though, so it's included. All the analysis is done in python which has a CLI at
`analyzer/cli.py` if you'd like to abstract this out.

## Future Work Ideas

- Clean separation of API and frontend
- Minimize resulting docker image size, especially if frontend isn't needed
- Use fine-tuning (or from-scratch) to retrain deepspeech to recognize phonemes
- Figure out why the GPU doesn't help very much, possibly unblock GPU acceleration
- Research CPU and GPU options
- This repo could use some more general tidying if it becomes long lived and actively developed
  - E.g. having local python venv installed breaks the docker build (possibly fixed - needs confirm)
