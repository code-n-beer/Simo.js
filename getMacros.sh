#!/bin/bash

if [ ! -f lib/macros.js ]; then
    wget -P lib/ http://prototyping.xyz/macros.js
else
    echo "lib/macros.js already exists, not overwriting"
fi
