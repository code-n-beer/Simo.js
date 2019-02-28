#!/bin/bash

docker-compose down --rm all && docker-compose build && docker-compose up -d && docker-compose logs --follow 
