FROM alpine:3.4

RUN echo http://dl-2.alpinelinux.org/alpine/edge/community/ >> /etc/apk/repositories

RUN apk add --no-cache icu-dev nodejs python make g++ openssh shadow bash

RUN adduser -D simobot

RUN apk add --update tzdata
ENV TZ=Europe/Helsinki

RUN mkdir /simobot
ADD ./package.json /simobot/
WORKDIR /simobot
RUN npm install

ADD ./ /simobot/

RUN usermod -u 1000 simobot
RUN chown -R simobot:simobot /simobot
RUN chown -R simobot:simobot /simobot/simojs-data/

CMD ["sh", "-c", "./getMacros.sh && ./repeatSimo"]
