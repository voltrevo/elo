#!/bin/bash

# Runs on the target server to install/replace with the new build

set -xeuo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]:-$0}"; )" &> /dev/null && pwd 2> /dev/null; )";
cd "$SCRIPT_DIR"

PROJECT=$(cat octopus-build/meta-*/PROJECT)
TAG=$(cat octopus-build/meta-*/TAG)

echo "PROJECT: $PROJECT"
echo "TAG: $TAG"

EXISTING=$(docker ps | grep -o 'octopus-[^ ]*' || true)

if [[ ${#EXISTING} -ne 0 ]]
then
  echo "Stoping existing octopus $EXISTING"
  docker stop $(docker ps | grep -o 'octopus-[^ ]*')

  if [[ "$EXISTING" == "$PROJECT"-"$TAG" ]]
  then
    echo "Removing conflicting container and image"
    docker rm $EXISTING
    docker image rm "$PROJECT":"$TAG"
  fi
else
  echo "No existing octopus to stop"
fi

docker load <octopus-build/"$PROJECT"-"$TAG".tar.gz

docker run \
  --name "$PROJECT"-"$TAG" \
  -d \
  --net=host \
  --mount type=bind,source="$HOME"/config.json,target=/app/config.json,readonly \
  --restart=unless-stopped \
  "$PROJECT":"$TAG"

mv octopus-build/extension.zip /var/www2/html/.

rm -rf octopus-build
