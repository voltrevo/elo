#!/bin/bash

# Runs on a machine with access to both the build server and the target server
# (target <=> host of the environment).

set -euo pipefail

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]:-$0}"; )" &> /dev/null && pwd 2> /dev/null; )";
cd "$SCRIPT_DIR"

BUILD_SERVER="gcp-workspace-4"
TARGET_SERVER="dev-JKwG2"

CLIENT_CONFIG_ID=$(shasum -a 256 client-config.json | head -c64)

rm -rf octopus-build

ssh "$BUILD_SERVER" 'mkdir -p workspaces/build-server'
scp client-config.json "$BUILD_SERVER":workspaces/build-server/$CLIENT_CONFIG_ID
scp build-octopus.sh "$BUILD_SERVER":workspaces/build-server/.
ssh "$BUILD_SERVER" "source .zshrc && ./workspaces/build-server/build-octopus.sh $CLIENT_CONFIG_ID"
scp -r "$BUILD_SERVER":workspaces/build-server/octopus-build .
ssh "$BUILD_SERVER" 'rm -rf workspaces/build-server/octopus-build'

ssh "$TARGET_SERVER" 'rm -rf octopus-build'
scp -r use-new-build.sh octopus-build "$TARGET_SERVER":.
scp server-config.json "$TARGET_SERVER":config.json
scp index.html "$TARGET_SERVER":/var/www2/html/.
ssh "$TARGET_SERVER" 'source .zshrc && ./use-new-build.sh'
scp octopus-build/VERSION "$TARGET_SERVER":/var/www2/html/version
rm -rf octopus-build
