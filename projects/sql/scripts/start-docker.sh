#!/bin/bash

set -euo pipefail

PROJECT="sql"
# TAG=git-eff1a71

docker run \
  --name "$PROJECT"-"$TAG" \
  -d \
  --mount type=bind,source="$HOME"/elo-config/"$PROJECT"-"$TAG".json,target=/app/config.json,readonly \
  --restart=unless-stopped \
  "$PROJECT":"$TAG"
