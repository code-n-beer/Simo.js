# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Running

Development runs entirely through Docker Compose. There is no npm start or test command — the bot only runs inside containers.

```bash
# First-time setup
cp settings.json.example simojs-data/settings.json
# Edit simojs-data/settings.json with your IRC server, credentials, and API keys
cp settings_pythonsimo.cfg.example settings_pythonsimo.cfg
mkdir -p simojs-data/html pythonsimo-data
touch pythonsimo-data/placeholder
echo '{}' > simojs-data/macros.js

# Start (skip llama — it needs a model file)
docker-compose up --no-deps redis sandbox pythonsimo simojs

# Tail logs
docker-compose logs -f simojs
```

For local development without a real IRC server, point `settings.json` at `ircdjs` and include it:

```bash
# In simojs-data/settings.json: "server": "ircdjs", "channels": ["#simo"], "botnick": "Simo"
docker-compose up --no-deps ircdjs redis sandbox pythonsimo simojs
```

The `simojs-data/` directory is mounted into the container at `/simojs-data/` and holds runtime state: `settings.json`, `macros.js`, SQLite DB, and generated HTML output.

## Running tests

```bash
node test/runner.js
```

Tests connect to localhost:6667, join `#simo`, and send IRC commands. The bot must be running. See `test/cases.json` for test cases and `test/client.js` for an interactive manual test client.

## Architecture

`main.js` is the entry point. It:
1. Reads `settings.json` from `/simojs-data/`
2. Loads all features from `features/index.js` (auto-discovery — every `.js` file except `index.js`)
3. Connects to IRC via `irc-upd`
4. Dispatches incoming messages through regex handlers, URL title fetcher, and `MultiCommand`

**Message dispatch flow:**
- Regex handlers in features run first on every message
- Non-command messages (no leading `!`) go to `lib/urltitle.js` for URL title fetching only
- Command messages (`!foo`) go through the hypermacro expander if they contain `!*`, then `MultiCommand`
- `MultiCommand` supports chaining up to depth 100: commands pipe output as input to the next command
- Unknown JS commands fall through to the `pythonsimo` HTTP service; if that fails and the command starts with `!+` or `!_`, it falls back to the sandcastle `!run`

## Macro system

Macros live in `/simojs-data/macros.js` (JSON). Three conventions:

| Prefix | Convention | Example |
|--------|-----------|---------|
| `!+name` | Takes args — `arg` variable holds the input | `exit(arg * 2)` |
| `!_name` | Prints — result is concat-merged with original line | `exit('hello world')` |
| `!*name` | Hypermacro — expands to a chain of other macros/commands | `+weatherapi _getlocation` |

Hypermacros are expanded by macrofy before dispatch. The expansion is recursive up to depth 100. Macros are re-read from disk on every message invocation.

Managing macros via IRC: `!addmacro`, `!delmacro`, `!printmacro`, `!listmacros`.

Sandbox scripts use `exit(value)` to return a result. Global variables from `lib/api.js` are available directly: `moment`, `axios`, `request`, `_` (lodash), `cheerio`, `rand`.

## Feature plugin system

Each file in `features/` is auto-loaded. A feature exports:

```js
module.exports = {
  commands: {
    '!cmd': function(client, channel, from, line) { ... }
  },
  regexes: {
    'key': function(client, channel, from, line) { ... }
  },
  init: function(config, client) { ... }  // optional, runs at startup
}
```

See `features/example.js` for the minimal template. Multiple features can register the same command — all handlers run.

## Key library files

- `lib/multicommand.js` — Command chaining engine; falls through to pythonsimo then sandcastle for `!+`/`!_` macros
- `lib/timerpoller.js` / `lib/timerdb.js` — Polls SQLite for scheduled timer messages
- `lib/urltitle.js` — Fetches and posts page titles for URLs in chat
- `lib/api.js` — API globals exposed to sandcastle scripts (`moment`, `axios`, `request`, `_`, etc.)
- `lib/simoInflux.js` — InfluxDB metric writer (currently disabled in dispatch)

## Services (docker-compose)

| Service | Purpose |
|---------|---------|
| `simojs` | Main IRC bot (Node.js 18) |
| `sandbox` | Sandcastle eval service (Node.js 8) — handles `!run` and user macros |
| `ircdjs` | Local IRC server for development only — not used in production |
| `pythonsimo` | Python companion at port 8888; handles commands unknown to the JS side |
| `redis` | Data store (used by pythonsimo) |
| `influxdb` | Metrics storage (v1.8) |
| `llama` | Local LLM (llama.cpp) at port 8111, used by `!simogpt` / `!simoq` — needs a model file |

## Notes

- The sandbox service runs on Node.js 8 deliberately — sandcastle's vm isolation relies on pre-Node-12 behavior.
- Long LLM responses are written to `/simojs-data/html/` and served at `http://gpt.prototyping.xyz/`.
- IRC messages are truncated to 400 characters before sending; most features use 390 as a safe limit.
- `pythonsimo` crashes on startup without its word2vec model file — this is expected in dev and the bot handles it gracefully.
