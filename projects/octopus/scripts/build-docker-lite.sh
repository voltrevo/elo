#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]:-$0}"; )" &> /dev/null && pwd 2> /dev/null; )";

PROJECT="octopus-lite"
TAG="git-$(git rev-parse HEAD | head -c7)"

docker build . -f Dockerfile.lite -t "$PROJECT":"$TAG"
rm -f build/"$PROJECT"-"$TAG".tar*
docker save "$PROJECT":"$TAG" --output build/"$PROJECT"-"$TAG".tar
gzip build/"$PROJECT"-"$TAG".tar

META_DIR=build/meta-"$PROJECT"-"$TAG"
mkdir "$META_DIR"
echo "$TAG" >"$META_DIR"/TAG
echo "$PROJECT" >"$META_DIR"/PROJECT

echo Success build/"$PROJECT"-"$TAG".tar.gz
