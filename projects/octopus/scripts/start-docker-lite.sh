#!/bin/bash

set -euo pipefail

PROJECT="octopus-lite"
# TAG=git-eff1a71-model-35d4164

docker run \
	--name "$PROJECT"-"$TAG" \
	-d \
	--net=host \
	--mount type=bind,source="$HOME"/elo-config/"$PROJECT"-"$TAG".json,target=/app/config.json,readonly \
	--restart=unless-stopped \
	"$PROJECT":"$TAG"
