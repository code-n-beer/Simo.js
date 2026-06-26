FROM node:18-slim

RUN apt-get update && apt-get install -y libicu-dev python3 python-is-python3 make g++ openssh-client bash curl && rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password simobot

ENV TZ=Europe/Helsinki

RUN mkdir /simobot
ADD ./package.json /simobot/
WORKDIR /simobot
RUN npm install

#ADD ./ /simobot/

# Add one file at a time, any nested folders won't be copied
# Cannot move entire folder for some reason
# jostain syystä ei toimi anteeksi piti sanomani
ADD ./lib/* ./lib/
ADD ./macros/* /simobot/macros/
ADD ./resources/* /simobot/resources/
ADD ./features/* /simobot/features/
ADD .gitignore joindb.js LightweightApi.py main.js migrate-logs.js package.json README.md redis.conf settings.json.example settings_pythonsimo.cfg settings_pythonsimo.cfg.example simojs.sqlite telegraf.conf ./
ADD ./templates/* /simobot/templates/

RUN chown -R simobot:simobot /simobot
#RUN chown -R simobot:simobot /simobot/simojs-data/
USER simobot

CMD ["node", "main.js"]
