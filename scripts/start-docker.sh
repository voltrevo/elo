#!/bin/bash

set -euo pipefail

# TAG=git-eff1a71-model-35d4164
# PORT=36582

docker run \
  --name elo-server-git-"$TAG" \
  -d \
  -p"$PORT":36582 \
  --mount type=bind,source="$HOME"/elo-config/config-"$TAG".json,target=/app/config.json,readonly \
  --restart=unless-stopped \
  elo-server:"$TAG"
