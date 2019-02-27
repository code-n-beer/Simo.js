#!/bin/bash

docker-compose down --rm all && docker-compose build --no-cache && docker-compose up -d && docker-compose logs && tail -f simojs-data/nodelogs
