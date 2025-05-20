FROM debian:10

RUN apt-get update && apt-get install -y libicu-dev nodejs npm python make g++ openssh-client bash curl

#RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
ENV NVM_DIR /usr/local/nvm
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

ENV NODE_VERSION v8.17.0
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

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
ADD addHost.sh backupSimo.sh dumpExpl.sh .gitignore joindb.js LightweightApi.py main.js marker migrate-logs.js package.json README.md redis.conf repeatSimo settings.json.example settings_pythonsimo.cfg settings_pythonsimo.cfg.example simojs.sqlite telegraf.conf test.log testscript ./
ADD ./templates/* /simobot/templates/

RUN usermod -u 1000 simobot
#RUN chown -R simobot:simobot /simobot
#RUN chown -R simobot:simobot /simobot/simojs-data/

CMD ["sh", "-c", "./addHost.sh && ./repeatSimo"]
