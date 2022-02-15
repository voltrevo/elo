#!/bin/bash

set -euo pipefail

PROJECT="elo-slack-automation"
# TAG=git-eff1a71-model-35d4164
# PORT=53047

docker run \
  --name "$PROJECT"-"$TAG" \
  -d \
  -p"$PORT":53047 \
  --mount type=bind,source="$HOME"/elo-config/"$PROJECT"-"$TAG".json,target=/app/config.json,readonly \
  --restart=unless-stopped \
  "$PROJECT":"$TAG"
