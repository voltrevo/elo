FROM nvcr.io/nvidia/tensorflow:20.06-tf1-py3

RUN apt update -y
# RUN apt install -y ffmpeg python3 python3-pip curl libcudnn7 python3-venv
RUN apt install -y ffmpeg curl python3-venv

RUN mkdir -p /data && \
  curl -L https://github.com/coqui-ai/STT-models/releases/download/english/coqui/v0.9.3/model.tflite >/data/models.tflite && \
  curl -L https://github.com/coqui-ai/STT-models/releases/download/english/coqui/v0.9.3/coqui-stt-0.9.3-models.scorer >/data/models.scorer

RUN curl -L https://nodejs.org/dist/v16.0.0/node-v16.0.0-linux-x64.tar.xz >/data/node.tar.gz && \
  tar xf /data/node.tar.gz -C /data && \
  mkdir -p /data/recordings

ENV PATH="/data/node-v16.0.0-linux-x64/bin:${PATH}"

ENV HOST="0.0.0.0" PORT=36582

ADD . /app

WORKDIR /app/analyzer
ENV PATH="/app/analyzer/venv/bin:$PATH"
RUN python -m venv venv
RUN python -m pip install -U pip
RUN python -m pip install wheel
RUN python -m pip install numpy stt dataclasses typing_extensions webrtcvad

ENV STT_TFLITE_DELEGATE="gpu"

WORKDIR /app
CMD [ "npm", "start" ]
