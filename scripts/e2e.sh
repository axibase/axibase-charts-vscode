#!/usr/bin/env bash


export CODE_TESTS_PATH="$(pwd)/client/out/test"
export CODE_TESTS_WORKSPACE="$(pwd)/client/testFixture"

node ./server/node_modules/vscode/bin/test --node-ipc --disable-extensions;