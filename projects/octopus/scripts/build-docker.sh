#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]:-$0}"; )" &> /dev/null && pwd 2> /dev/null; )";

rm -rf "$SCRIPT_DIR/../analyzer"
cp -a "$SCRIPT_DIR/../../elo-worker/analyzer" "$SCRIPT_DIR/../analyzer"

rm -rf "$SCRIPT_DIR/../data"
cp -a "$SCRIPT_DIR/../../elo-worker/data" "$SCRIPT_DIR/../data"

PROJECT="octopus"
TAG="git-$(git rev-parse HEAD | head -c7)-model-$(shasum -a 256 data/models.tflite | head -c7)"

docker build . -t "$PROJECT":"$TAG"
rm -f build/"$PROJECT"-"$TAG".tar*
docker save "$PROJECT":"$TAG" --output build/"$PROJECT"-"$TAG".tar
gzip build/"$PROJECT"-"$TAG".tar

echo Success build/"$PROJECT"-"$TAG".tar.gz
