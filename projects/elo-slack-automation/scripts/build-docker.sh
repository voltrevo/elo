#!/bin/bash

set -euo pipefail

PROJECT="elo-slack-automation"
TAG="git-$(git rev-parse HEAD | head -c7)"

docker build . -t "$PROJECT":"$TAG"
rm -f build/"$PROJECT"-"$TAG".tar*
docker save "$PROJECT":"$TAG" --output build/"$PROJECT"-"$TAG".tar
gzip build/"$PROJECT"-"$TAG".tar

echo Success build/"$PROJECT"-"$TAG".tar.gz
