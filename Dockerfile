FROM alpine:3.4

RUN apk add --no-cache icu-dev nodejs python make g++

RUN adduser -D simobot
RUN npm install -g nodemon

RUN mkdir /simobot
ADD ./package.json /simobot/
WORKDIR /simobot
RUN npm install

ADD ./ /simobot/

RUN apk add --update tzdata
ENV TZ=Europe/Helsinki

RUN chown -R simobot:simobot /simobot
USER simobot


CMD ["sh", "-c", "DOCKER_HOST=$(ip route | awk '/^default via /{print $3}') ./repeatSimo"]
