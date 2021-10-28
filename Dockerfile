FROM nvidia/cuda:10.1-runtime-ubuntu18.04

RUN apt update -y
RUN apt install -y ffmpeg python3 python3-pip curl libcudnn7 python3-venv
RUN python3 -m venv venv

RUN mkdir -p /data && \
  curl -L https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm >/data/models.pbmm

RUN curl -L https://nodejs.org/dist/v16.0.0/node-v16.0.0-linux-x64.tar.xz >/data/node.tar.gz && \
  tar xf /data/node.tar.gz -C /data && \
  mkdir -p /data/recordings

ENV PATH="/data/node-v16.0.0-linux-x64/bin:${PATH}"

ENV HOST="0.0.0.0" PORT=36582

ADD . /app

WORKDIR /app/analyzer
ENV PATH="/app/analyzer/venv/bin:$PATH"
RUN pip3 install deepspeech-gpu dataclasses typing_extensions webrtcvad

WORKDIR /app
CMD [ "npm", "start" ]
