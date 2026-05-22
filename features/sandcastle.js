const axios = require('axios');
const fs = require('fs');
var macroPath = '/simojs-data/macros.js';
const concat = require('../lib/concat.js');

const SANDBOX_URL = 'http://sandbox:3456/run';

var macros = {};
var init = function(config) {
    var macroFile = fs.readFileSync(macroPath);
    macros = JSON.parse(macroFile);
}

var run = function(client, channel, from, line) {

    const runScript = (line) => {
        axios.post(SANDBOX_URL, { code: line, arg: lineArr.join(' ') }, { timeout: 12000 })
            .then(response => {
                const { result, error } = response.data;
                if (error) {
                    client.say(channel, error.toString());
                    return;
                }
                var res = result instanceof Object ? JSON.stringify(result) : String(result);
                if (!client.isMock) {
                    res = res.substring(0, 10000);
                }
                res = res.replace(/(\r\n|\n|\r)/gm, ' ');
                res = res.replace(/^"/, '');
                res = res.replace(/"$/, '');
                res = res.length ? res : 'script returned empty string';
                if (!~res.indexOf('[OO HILJAA]'))
                    client.say(channel, macroName[0] === '_' ? concat(res, lineArr.join(' ')) : res);
            })
            .catch(err => {
                client.say(channel, 'sandbox error: ' + err.message);
            });
    }

    line = line.substring('!run '.length);
    var lineArr = line.split(' ');
    let macroName = '';
    if (macros.hasOwnProperty(lineArr[0])) {
        macroName = lineArr.shift();
        line = macros[macroName];
    }

    const innerMacro = line.match(/!([\+_][a-ö]+)(\$\$(.*)\$\$)?/);
    if (innerMacro && macros.hasOwnProperty(innerMacro[1])) {
        const lineMock = '!run ' + (innerMacro[3] ? innerMacro[1] + ' ' + innerMacro[3] : innerMacro[1]);
        const clientMock = {
            isMock: true,
            say: (_, res) => {
                res = isNaN(parseFloat(res)) ? `"${res}"` : res;
                runScript(line.replace(innerMacro[0], res));
            }
        };
        run(clientMock, '', '', lineMock);
    } else {
        runScript(line);
    }
}

var addMacro = function(name, script, callback) {
    if (!['_', '+', '*'].includes(name[0])) {
        callback('error: macro names must begin with \'+\',\'*\', or \'_\'');
        return;
    }
    if (script.split(' ').includes(name)) {
        callback('error: recursion not allowed in macros');
        return;
    }
    macros[name] = script;
    writeMacros(callback);
}

var writeMacros = function(callback) {
    fs.writeFile(macroPath, JSON.stringify(macros), function(err) {
        callback(err);
    });
}

var newMacro = function(client, channel, from, line) {
    line = line.substring('!addmacro '.length);
    var words = line.split(' ');
    var name = words[0];
    var script = line.substring(name.length + 1);
    addMacro(name, script, function(err) {
        if (err) {
            console.log(err);
            client.say(channel, err);
        } else {
            client.say(channel, 'added macro');
        }
    });
}

var delMacro = function(client, channel, from, line) {
    line = line.substring('!delmacro '.length);
    var words = line.split(' ');
    var name = words[0];
    delete macros[name];
    writeMacros(function() {
        client.say(channel, 'removed');
    });
}

const printMacro = (client, channel, from, line) =>
    client.say(channel, macros[line.split(' ')[1]]);

const listMacros = (client, channel, from, line) =>
    client.say(channel, Object.keys(macros).join(' '));

module.exports = {
    name: 'eval in a sandbox',
    commands: {
        '!run': run,
        '!addmacro': newMacro,
        '!delmacro': delMacro,
        '!printmacro': printMacro,
        '!listmacros': listMacros
    },
    init: init
}
