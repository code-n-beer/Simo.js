#!/bin/bash

macro=$1
if [ -z "$1" ];then
    echo "Usage: ./dumpExpl.sh <expl_key>"
    exit 1
fi

docker-compose exec redis redis-cli --raw -n 2 lrange ${macro} 0 -1  > ${macro}.txt
echo "${macro}.txt created"
