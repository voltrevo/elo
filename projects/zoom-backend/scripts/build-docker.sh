#!/bin/bash

set -euo pipefail

PROJECT="elo-worker"
TAG="git-$(git rev-parse HEAD | head -c7)-model-$(shasum -a 256 data/models.tflite | head -c7)"

docker build . -t "$PROJECT":"$TAG"
rm -f build/"$PROJECT"-"$TAG".tar*
docker save "$PROJECT":"$TAG" --output build/"$PROJECT"-"$TAG".tar
gzip build/"$PROJECT"-"$TAG".tar

echo Success build/"$PROJECT"-"$TAG".tar.gz
