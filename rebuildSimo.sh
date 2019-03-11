#!/bin/bash

docker-compose down --rm local && docker-compose build && docker-compose up -d && docker-compose logs --follow 
