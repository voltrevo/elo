FROM nvidia/cuda:10.1-runtime-ubuntu18.04

RUN apt update -y
RUN apt install python3 python3-pip -y

RUN pip3 install deepspeech-gpu

RUN apt install curl -y

RUN mkdir -p /data && \
  curl -L https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm >/data/models.pbmm && \
  curl -L https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/audio-0.9.3.tar.gz >/data/audio.tar.gz

RUN tar xf /data/audio.tar.gz -C /data

RUN apt install libcudnn7

CMD [ "deepspeech", "--model", "/data/models.pbmm", "--audio", "/data/audio/2830-3980-0043.wav" ]
