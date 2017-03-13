FROM alpine:3.4

RUN apk add --no-cache icu-dev nodejs python make g++

RUN adduser -D nodejs
RUN npm install -g nodemon
#RUN chown -R nodejs:nodejs /simobot

USER nodejs
WORKDIR /simobot

CMD ["sh", "-c", "npm install && nodemon /simobot/main.js"]
