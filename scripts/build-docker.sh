#!/bin/bash

set -euo pipefail

TAG="git-$(git rev-parse HEAD | head -c7)-model-$(shasum -a 256 data/models.tflite | head -c7)"

sudo docker build . -t elo-server:"$TAG"
sudo docker save elo-server:"$TAG" --output build/elo-server-"$TAG".tar
gzip build/elo-server-"$TAG".tar

echo Success build/elo-server-"$TAG".tar.gz
