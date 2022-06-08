#!/bin/bash

set -euo pipefail

PROJECT="octopus"
# TAG=git-eff1a71
# PORT=18053

docker run \
  --name "$PROJECT"-"$TAG" \
  -d \
  \ # TODO: Expose multiple ports
  --mount type=bind,source="$HOME"/elo-config/"$PROJECT"-"$TAG".json,target=/app/config.json,readonly \
  --restart=unless-stopped \
  "$PROJECT":"$TAG"
