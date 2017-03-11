FROM alpine:3.4

RUN apk add --no-cache nodejs-lts redis git python make g++ supervisor

RUN npm install --global ircdjs

COPY ./config/supervisord.conf /etc/supervisord.conf
COPY . /simobot 

RUN npm install --global ircdjs && cd /simobot && npm install && rm -fr /root/.npm && npm cache clear

CMD ["/usr/bin/supervisord"]
