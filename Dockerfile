FROM debian:10

RUN apt-get update && apt-get install -y libicu-dev nodejs npm python make g++ openssh-client bash

RUN adduser --disabled-password simobot

ENV TZ=Europe/Helsinki

RUN mkdir /simobot
ADD ./package.json /simobot/
WORKDIR /simobot
RUN npm install

ADD ./ /simobot/

RUN usermod -u 1000 simobot
RUN chown -R simobot:simobot /simobot
RUN chown -R simobot:simobot /simobot/simojs-data/

CMD ["sh", "-c", "./addHost.sh && ./repeatSimo"]
