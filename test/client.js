#!/usr/bin/env node
// Quick IRC test client. Usage: node testclient.js [nick]
// Connects to localhost:6667, joins #simo, echoes responses.
// Type messages in the terminal:
//   !run 1+1
//   !addmacro +hello return 'hello world'
//   !run +hello
//   !listmacros
// Prefix with / for raw IRC commands, e.g. /QUIT

const net = require('net');
const readline = require('readline');

const NICK = process.argv[2] || 'testuser';
const CHANNEL = '#simo';

const client = net.createConnection({ host: 'localhost', port: 6667 });
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let buffer = '';

client.on('connect', () => {
    console.log(`Connected. Registering as ${NICK}...`);
    send(`NICK ${NICK}`);
    send(`USER ${NICK} 0 * :Test User`);
});

client.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\r\n');
    buffer = lines.pop();
    lines.forEach(line => {
        if (line.startsWith('PING')) {
            send('PONG ' + line.split(' ')[1]);
            return;
        }
        console.log('<', line);

        // Join channel once we get the welcome (001)
        if (line.includes(' 001 ')) {
            send(`JOIN ${CHANNEL}`);
            console.log(`\nJoined ${CHANNEL}. Type commands or /RAW_IRC_COMMAND\n`);
        }
    });
});

client.on('error', err => console.error('Connection error:', err.message));
client.on('close', () => { console.log('Disconnected.'); process.exit(0); });

rl.on('line', (line) => {
    if (!line.trim()) return;
    if (line.startsWith('/')) {
        send(line.slice(1));
    } else {
        send(`PRIVMSG ${CHANNEL} :${line}`);
        console.log(`> ${NICK}: ${line}`);
    }
});

function send(msg) {
    client.write(msg + '\r\n');
}
