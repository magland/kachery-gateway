#!/bin/bash

set -ex

docker build -t magland/kachery-gateway-processing:0.1.0 .

echo "docker push magland/kachery-gateway-processing:0.1.0"