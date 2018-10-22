#FROM ubuntu:xenial
#FROM hypriot/rpi-node
FROM arm32v6/node:10.12-alpine

#RUN apt-get update
#RUN apt-get install -y sudo curl wget telnet iputils-ping ghc build-essential python

#RUN curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
#RUN sudo apt-get install -y nodejs
RUN echo http://dl-2.alpinelinux.org/alpine/edge/community/ >> /etc/apk/repositories

RUN apk add --no-cache shadow sudo curl wget iputils


RUN mkdir -p /home/simobot

ADD . /home/simobot

RUN groupadd -r simobot && useradd -r -g simobot simobot

RUN echo "simobot ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/default; 

RUN chown -R simobot:simobot /home/simobot

USER simobot

WORKDIR /home/simobot

RUN npm install
