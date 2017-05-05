FROM ubuntu:xenial

RUN apt-get update
RUN apt-get install -y sudo curl

RUN curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
RUN sudo apt-get install -y nodejs

RUN mkdir -p /simo

ADD . /simo

WORKDIR /simo

RUN npm install
