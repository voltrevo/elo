FROM ubuntu:20.04

# Prevent tzdata stdin reading issue
ENV DEBIAN_FRONTEND="noninteractive" TZ="Etc/UTC"

# Install system packages
RUN apt update -y
RUN apt install -y curl xz-utils

# Install nodejs
WORKDIR /data
RUN curl -L https://nodejs.org/dist/v16.13.0/node-v16.13.0-linux-x64.tar.xz | tar xJf -
ENV PATH="/data/node-v16.13.0-linux-x64/bin:${PATH}"

# AWS rds ca
RUN curl -LO https://truststore.pki.rds.amazonaws.com/ap-southeast-2/ap-southeast-2-bundle.pem

# Add remaining files
ADD . /app

# Startup configuration
WORKDIR /app
CMD [ "npm", "start" ]
