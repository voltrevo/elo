FROM nvidia/cuda:10.1-runtime-ubuntu18.04

RUN apt update -y
RUN apt install python3 python3-pip curl libcudnn7 -y

RUN pip3 install deepspeech-gpu

RUN mkdir -p /data && \
  curl -L https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm >/data/models.pbmm
