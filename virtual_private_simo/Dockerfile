FROM ubuntu:xenial

RUN apt-get update
RUN apt-get install -y sudo curl wget telnet iputils-ping ghc build-essential python

RUN curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
RUN sudo apt-get install -y nodejs

RUN mkdir -p /home/simobot

ADD . /home/simobot

RUN sudo groupadd -r simobot && sudo useradd -r -g simobot simobot

RUN chown -R simobot:simobot /home/simobot

USER simobot

WORKDIR /home/simobot

RUN npm install
