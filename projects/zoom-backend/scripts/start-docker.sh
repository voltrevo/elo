#!/bin/bash

set -euo pipefail

PROJECT="zoom-backend"
# TAG=git-eff1a71
# PORT=18053

docker run \
  --name "$PROJECT"-"$TAG" \
  -d \
  -p"$PORT":18053 \
  --mount type=bind,source="$HOME"/elo-config/"$PROJECT"-"$TAG".json,target=/app/config.json,readonly \
  --restart=unless-stopped \
  "$PROJECT":"$TAG"
