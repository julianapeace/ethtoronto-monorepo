#!/usr/bin/env bash

cd "$(dirname "$0")"
cd ../src/build/snark/
http-server -p 8000 --cors

