#!/usr/bin/env node
// IRC integration test runner for Simo.
// Usage: node test/runner.js [test/cases.json]
// Exits 0 on all pass, 1 on any failure or timeout.
//
// Env vars:
//   IRC_HOST        (default: localhost)
//   IRC_PORT        (default: 6667)
//   TEST_TIMEOUT_MS (default: 15000)
//
// Test file format (JSON array):
//   [{ "cmd": "!run exit(1+1)", "expect": "^2$", "desc": "optional label" }, ...]
// "expect" is a JS regex pattern matched against the bot's response text.

const net  = require('net');
const fs   = require('fs');
const path = require('path');

const HOST       = process.env.IRC_HOST        || 'localhost';
const PORT       = parseInt(process.env.IRC_PORT        || '6667');
const TIMEOUT_MS = parseInt(process.env.TEST_TIMEOUT_MS || '15000');
const CHANNEL    = '#simo';
const NICK       = 'citest' + Math.floor(Math.random() * 9000 + 1000);

const testFile = process.argv[2] || path.join(__dirname, 'cases.json');
let TESTS;
try {
    TESTS = JSON.parse(fs.readFileSync(testFile, 'utf8'));
} catch (e) {
    console.error('Failed to load test file:', testFile, '-', e.message);
    process.exit(1);
}

const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const RESET = '\x1b[0m';

let buffer          = '';
let responseResolve = null;
let passed          = 0;
let failed          = 0;

const client = net.createConnection({ host: HOST, port: PORT });

client.on('data', data => {
    buffer += data.toString();
    const lines = buffer.split('\r\n');
    buffer = lines.pop();
    lines.forEach(line => {
        if (line.startsWith('PING')) {
            client.write('PONG ' + line.split(' ')[1] + '\r\n');
            return;
        }
        const match = line.match(/^:Simo![^\s]+ PRIVMSG #\S+ :(.+)$/);
        if (match && responseResolve) {
            const resolve = responseResolve;
            responseResolve = null;
            resolve(match[1]);
        }
    });
});

client.on('error', err => { console.error('Connection error:', err.message); process.exit(1); });

function send(msg) { client.write(msg + '\r\n'); }

function nextResponse() {
    return new Promise((resolve, reject) => {
        responseResolve = resolve;
        setTimeout(() => {
            if (responseResolve) {
                responseResolve = null;
                reject(new Error('timeout after ' + TIMEOUT_MS + 'ms'));
            }
        }, TIMEOUT_MS);
    });
}

async function runTests() {
    await new Promise(resolve => {
        const onData = data => {
            if (data.toString().includes(' 001 ')) {
                client.off('data', onData);
                resolve();
            }
        };
        client.on('data', onData);
        send(`NICK ${NICK}`);
        send(`USER ${NICK} 0 * :CI Test`);
    });

    send(`JOIN ${CHANNEL}`);
    await new Promise(r => setTimeout(r, 500));

    console.log(`Connected as ${NICK} on ${HOST}:${PORT}`);
    console.log(`Running ${TESTS.length} tests from ${path.basename(testFile)}\n`);

    for (const test of TESTS) {
        const label = test.desc ? `${test.desc} (${test.cmd})` : test.cmd;
        send(`PRIVMSG ${CHANNEL} :${test.cmd}`);

        let response;
        try {
            response = await nextResponse();
        } catch (e) {
            console.log(`${RED}FAIL${RESET}  ${label}`);
            console.log(`      ${e.message}`);
            failed++;
            continue;
        }

        const pattern = new RegExp(test.expect);
        if (pattern.test(response)) {
            console.log(`${GREEN}PASS${RESET}  ${label}`);
            console.log(`      got: ${response}`);
            passed++;
        } else {
            console.log(`${RED}FAIL${RESET}  ${label}`);
            console.log(`      expected pattern: ${test.expect}`);
            console.log(`      got:              ${response}`);
            failed++;
        }
    }

    console.log(`\n${passed}/${passed + failed} passed`);
    process.exitCode = failed > 0 ? 1 : 0;
    send('QUIT :done');
    client.destroy();
}

client.on('connect', () => runTests().catch(err => {
    console.error('Unexpected error:', err);
    process.exitCode = 1;
    client.destroy();
}));
