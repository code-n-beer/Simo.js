#FROM alpine:edge
#FROM mhart/alpine-node:10
FROM node:10-alpine3.11

RUN apk upgrade -U -a
RUN apk add --update --no-cache util-linux util-linux-dev icu-dev python make g++ openssh shadow bash glib glib-dev pango expat expat-dev util-linux-dev gcc make libc6-compat vips-dev fftw-dev build-base \ 
        --repository http://dl-cdn.alpinelinux.org/alpine/edge/community \
        --repository http://dl-cdn.alpinelinux.org/alpine/edge/main

RUN adduser -D simobot

RUN apk add --update tzdata
ENV TZ=Europe/Helsinki

RUN mkdir /simobot
ADD ./package.json /simobot/
WORKDIR /simobot
RUN npm install

ADD ./addHost.sh /simobot/
ADD ./repeatSimo /simobot/
ADD ./lib /simobot/lib
ADD ./features /simobot/features
ADD ./main.js /simobot/

#RUN usermod -u 1000 simobot
RUN chown -R simobot:simobot /simobot

CMD ["sh", "-c", "./addHost.sh && ./repeatSimo"]
