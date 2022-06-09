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
scp client-config.json "$BUILD_SERVER":workspaces/build-server/$CLIENT_CONFIG_ID
ssh "$BUILD_SERVER" "source .zshrc && ./workspaces/build-server/build-octopus.sh $CLIENT_CONFIG_ID"
scp -r "$BUILD_SERVER":workspaces/build-server/octopus-build .
ssh "$BUILD_SERVER" 'rm -rf workspaces/build-server/octopus-build'

ssh "$TARGET_SERVER" 'rm -rf octopus-build'
scp -r octopus-build "$TARGET_SERVER":.
ssh "$TARGET_SERVER" 'source .zshrc && ./use-new-build.sh'
rm -rf octopus-build
