FROM ubuntu:20.04

# Install system packages
RUN apt update -y
RUN apt install -y ffmpeg curl python3-venv build-essential python3-dev

# Set up python
ADD analyzer /app/analyzer
WORKDIR /app/analyzer
ENV PATH="/app/analyzer/venv/bin:${PATH}"
RUN python3 -m venv venv
RUN pip install -U pip
RUN pip install -r requirements.txt

# Install nodejs
RUN curl -L https://nodejs.org/dist/v16.13.0/node-v16.13.0-linux-x64.tar.xz | tar xf - -C /data
ENV PATH="/data/node-v16.13.0-linux-x64/bin:${PATH}"

# Add remaining files
ADD . /app
RUN ln -s /app/data/models.tflite /data/models.tflite

# Startup configuration
ENV HOST="0.0.0.0" PORT=36582
WORKDIR /app
CMD [ "npm", "start" ]
