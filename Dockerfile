FROM alpine:3.4

RUN echo http://dl-2.alpinelinux.org/alpine/edge/community/ >> /etc/apk/repositories

RUN apk add --no-cache icu-dev nodejs python make g++ openssh shadow

RUN adduser -D simobot
RUN npm install -g nodemon

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
RUN chmod 600 /simobot/simojs-data/ssh/id_rsa_nopasswd
#USER simobot

#RUN id -u simobot
#RUN id -g simobot


CMD ["sh", "-c", "DOCKER_HOST=$(ip route | awk '/^default via /{print $3}') ./repeatSimo >> /simojs-data/nodelogs"]
