FROM ubuntu:20.04

# Prevent tzdata stdin reading issue
ENV DEBIAN_FRONTEND="noninteractive" TZ="Etc/UTC"

# Install system packages
RUN apt update -y
RUN apt install -y ffmpeg curl python3-venv build-essential python3-dev

# Set up python
WORKDIR /app/analyzer
ADD analyzer /app/analyzer
ENV PATH="/app/analyzer/venv/bin:${PATH}"
RUN python3 -m venv venv
RUN pip install -U pip
RUN pip install -r requirements.txt

# Install nodejs
WORKDIR /data
RUN curl -L https://nodejs.org/dist/v16.13.0/node-v16.13.0-linux-x64.tar.xz | tar xJf -
ENV PATH="/data/node-v16.13.0-linux-x64/bin:${PATH}"

# Add remaining files
ADD . /app
RUN ln -s /app/data/models.tflite /data/models.tflite

# Startup configuration
WORKDIR /app
ENV HOST="0.0.0.0" PORT=36582
CMD [ "npm", "start" ]
