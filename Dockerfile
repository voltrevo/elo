FROM nvidia/cuda:10.1-cudnn7-runtime-ubi8

RUN yum update -y
RUN yum install python3 -y

RUN pip3 install deepspeech-gpu

RUN mkdir -p /data && \
  curl -L https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm >/data/models.pbmm && \
  curl -L https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/audio-0.9.3.tar.gz >/data/audio.tar.gz

RUN tar xf /data/audio.tar.gz -C /data
