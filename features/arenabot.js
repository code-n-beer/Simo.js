// features/arena-bot.js

const axios = require('axios');
const fs = require('fs');

const OPENAI_SETTINGS_PATH = '/simojs-data/settings.json';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-5-chat-latest';

// Backend + frontend URLs
const ARENA_API_BASE = 'http://prototyping.xyz:8667';
const ARENA_FRONTEND_BASE = 'http://prototyping.xyz:8666';

// ---- OpenAI auth ----

let openaiToken;
try {
    openaiToken = JSON.parse(fs.readFileSync(OPENAI_SETTINGS_PATH, 'utf8')).openai.api_key;
} catch (e) {
    console.error('Failed to read OpenAI API key from settings.json:', e);
    openaiToken = null;
}

const openaiHeaders = {
    headers: {
        'Authorization': `Bearer ${openaiToken}`,
        'Content-Type': 'application/json'
    }
};

// ---- Arena docs / context ----

const ARENA_DOCS_PATH = '/simojs-data/arenabot-docs.txt';

function loadArenaDocs() {
    try {
        return fs.readFileSync(ARENA_DOCS_PATH, 'utf8');
    } catch (e) {
        console.error('Failed to load ArenaBot docs from', ARENA_DOCS_PATH, e);
        return null;
    }
}

// System prompt enforcing [SCRIPT] ... [/SCRIPT] output only.
const ARENA_SYSTEM_PROMPT = `
You generate JavaScript bots for the Neon Gladiators arena.

Output rules (IMPORTANT):
- Output ONLY the bot's JavaScript code.
- Wrap the entire code in [SCRIPT] and [/SCRIPT], exactly like:

[SCRIPT]
...javascript code...
[/SCRIPT]

No markdown, no backticks, no explanation text.
`;

// ---- Parsing ----

/**
 * Parse IRC line of the form:
 *   "!arenabot [Bot Name] description of bot..."
 *
 * Returns { name, description } or { error: 'syntax' | 'missingDescription' }.
 */
function parseArenaBotCommand(line) {
    if (!line) return { error: 'syntax' };

    // Strip the command prefix "!arenabot" (case-insensitive), keep everything after it intact.
    const withoutCommand = line.replace(/^!arenabot\s+/i, '').trim();
    if (!withoutCommand) return { error: 'syntax' };

    // First [...] block is the bot name.
    const nameMatch = withoutCommand.match(/\[([^\]]+)\]/);
    if (!nameMatch) return { error: 'syntax' };

    const name = nameMatch[1].trim();
    if (!name) return { error: 'syntax' };

    const afterName = withoutCommand.slice(nameMatch.index + nameMatch[0].length).trim();
    if (!afterName) return { error: 'missingDescription' };

    return {
        name,
        description: afterName
    };
}

// ---- LLM call ----

async function generateArenaBotScript(botName, description) {
    if (!openaiToken) {
        throw new Error('OpenAI token not configured on server.');
    }

    const arenaDocs = loadArenaDocs();
    if (!arenaDocs) {
        throw new Error('ArenaBot docs file missing or unreadable.');
    }

    const userPrompt = `
${arenaDocs}

User wants a new bot with the following high-level behaviour and style:

Bot name: "${botName}"
Requested behaviour / style: ${description}

Generate a single self-contained JavaScript bot file:

- Must define function update(me, enemy, board).
- No imports, requires, async, or external calls.
- Must run under isolated-vm with strict time limits.
- Wrap ONLY the JavaScript code in [SCRIPT] ... [/SCRIPT].
`;

    const body = {
        model: OPENAI_MODEL,
        max_tokens: 1500,
        temperature: 0.9,
        messages: [
            { role: 'system', content: ARENA_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
        ]
    };

    const res = await axios.post(OPENAI_ENDPOINT, body, openaiHeaders);
    const raw =
        res.data &&
        res.data.choices &&
        res.data.choices[0] &&
        res.data.choices[0].message
            ? res.data.choices[0].message.content || ''
            : '';

    const script = extractScriptFromResponse(raw);
    if (!script || script.length < 10) {
        throw new Error('Generated script was empty or too short.');
    }

    return script;
}

/**
 * Extract [SCRIPT] ... [/SCRIPT] region and strip any stray ``` fences.
 */
function extractScriptFromResponse(raw) {
    if (!raw) return '';

    const m = raw.match(/\[SCRIPT\]([\s\S]*?)\[\/SCRIPT\]/i);
    let code = m ? m[1] : raw;

    code = code.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '');
    return code.trim();
}

// ---- Arena API submit ----

/**
 * Submit script to arena server at prototyping.xyz:8667.
 * /api/submit already runs the gauntlet / smoke test.
 */
async function submitToArena(botName, script) {
    const url = `${ARENA_API_BASE}/api/submit`;
    const payload = { name: botName, userCode: script };

    const res = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
    });

    return res.data;
}

// ---- IRC command handler ----

async function handleArenaBotCommand(client, channel, from, line) {
    const parsed = parseArenaBotCommand(line);

    if (parsed.error) {
        if (parsed.error === 'missingDescription') {
            client.say(channel, 'Error: you must give a description after the [Bot Name]. Syntax: !arenabot [Bot Name] description of the bot');
        } else {
            client.say(channel, 'Error: syntax: !arenabot [Bot Name] description of the bot');
        }
        return;
    }

    const { name: botName, description } = parsed;

    try {
        const script = await generateArenaBotScript(botName, description);
        const submitResult = await submitToArena(botName, script);

        if (!submitResult || submitResult.success !== true) {
            const err = submitResult && submitResult.error ? submitResult.error : 'Unknown error';
            client.say(channel, `Arena rejected "${botName}": ${err}`);
            return;
        }

        const shareUrl = `${ARENA_FRONTEND_BASE}/#${encodeURIComponent(botName)}`;
        client.say(channel, `Bot "${botName}" accepted into PvP. Follow it here: ${shareUrl}`);
    } catch (e) {
        console.error('!arenabot error:', e);
        client.say(channel, `Error for "${botName}": ${e.message}`);
    }
}

module.exports = {
    name: 'arena-bot',
    commands: {
        '!arenabot': (client, channel, from, line) => {
            handleArenaBotCommand(client, channel, from, line)
                .catch(err => {
                    console.error('Unhandled arenabot error:', err);
                    client.say(channel, `Error in !arenabot: ${err.message}`);
                });
        }
    }
};

