Simo.js
=======

Simo goes javascript

### Running local development version

```bash
# Clone and set up config
cp settings.json.example simojs-data/settings.json
# Edit simojs-data/settings.json with your IRC server, credentials, and API keys
cp settings_pythonsimo.cfg.example settings_pythonsimo.cfg
mkdir -p simojs-data/html pythonsimo-data
touch pythonsimo-data/placeholder
echo '{}' > simojs-data/macros.js

docker-compose up --no-deps redis sandbox pythonsimo simojs
```

All logs go to container stdouts — `docker-compose logs -f simojs` is your friend.

`llama` is excluded above since it requires a model file. Add it back and mount a model under `./models/` when needed.

#### Local development with a local IRC server

Point `settings.json` at `ircdjs` and start it alongside the bot:

```bash
# In simojs-data/settings.json set: "server": "ircdjs"
docker-compose up --no-deps ircdjs redis sandbox pythonsimo simojs
```

### Running tests

```bash
node test/runner.js
```

### Feature development

See `features/example.js`.
