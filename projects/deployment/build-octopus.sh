#!/bin/bash

# Runs on the build server

set -xeuo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]:-$0}"; )" &> /dev/null && pwd 2> /dev/null; )";
cd "$SCRIPT_DIR"

CLIENT_CONFIG_ID="$1"

rm -rf elo
rm -rf octopus-build
mkdir octopus-build
git clone git@github.com:voltrevo/elo

pushd elo/projects/octopus
  yarn
  yarn build
  yarn test
  ./scripts/build-docker.sh
  mv build/octopus-*.tar.gz "$SCRIPT_DIR"/octopus-build/.
  git rev-parse HEAD | head -c7 >"$SCRIPT_DIR"/octopus-build/VERSION
  mv build/meta-* "$SCRIPT_DIR"/octopus-build/.
popd

pushd elo/projects/elo-extension
  yarn
  cp "$SCRIPT_DIR"/"$CLIENT_CONFIG_ID" config.json
  sed -i "s/SED_REPLACE__VERSION/$(git rev-parse HEAD | head -c7)/g" config.json
  yarn build
  yarn test
  pushd build
    zip -r extension.zip extension
    mv extension.zip "$SCRIPT_DIR"/octopus-build/.
  popd
popd

rm -rf elo
