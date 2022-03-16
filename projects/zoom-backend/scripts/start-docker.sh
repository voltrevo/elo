#!/bin/bash

set -euo pipefail

PROJECT="elo-worker"
# TAG=git-eff1a71-model-35d4164
# PORT=36582

docker run \
  --name "$PROJECT"-"$TAG" \
  -d \
  -p"$PORT":36582 \
  --mount type=bind,source="$HOME"/elo-config/"$PROJECT"-"$TAG".json,target=/app/config.json,readonly \
  --restart=unless-stopped \
  "$PROJECT":"$TAG"
