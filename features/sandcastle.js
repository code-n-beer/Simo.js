const express = require('express')
const app = express()
app.listen(8123, function() {
    console.log('Simo macro lister listening on port 8123')
})
const SandCastle = require('sandcastle').SandCastle;
const fs = require('fs');
var macroPath = '/simojs-data/macros.js';
const concat = require('../lib/concat.js');
var sbox = new SandCastle({
    cwd: __dirname,
    api: __dirname + '/../lib/api.js',
    memoryLimitMB: 128,
    timeout: 10000,
});

var macros = {};
var init = function(config) {
    var macroFile = fs.readFileSync(macroPath);
    macros = JSON.parse(macroFile);
}

var run = function(client, channel, from, line) {

    const runScript = (line) => {
        var script = sbox.createScript("exports.main = function() {" + line + "}");

        script.on('exit', function(err, output) {
            console.log('err: ' + err);
            console.log('output: ' + output);
            if (!err) {
                res = output instanceof Object ? JSON.stringify(output) : String(output)
                if (!client.isMock) {
                    res = res.substring(0, 400);
                }
                res = res.replace(/(\r\n|\n|\r)/gm, ' ');
                res = res.replace(/^"/, '');
                res = res.replace(/"$/, '');
                res = res.length ? res : 'script returned empty string'
                if (!~res.indexOf('[OO HILJAA]'))
                    client.say(channel, macroName[0] === '_' ? concat(res, lineArr.join(" ")) : res);
            } else {
                res = err.toString();
                client.say(channel, res);
            }
        });
        script.on('timeout', function() {
            console.log('script timed out');
            client.say(channel, 'script timed out');
        });

        script.run({
            arg: lineArr.join(" ")
        });
    }

    line = line.substring('!run '.length);
    var lineArr = line.split(" ");
    let macroName = ''
    if (macros.hasOwnProperty(lineArr[0])) {
        macroName = lineArr.shift()
        line = macros[macroName];
    }

    const innerMacro = line.match(/!([\+_][a-ö]+)(\$\$(.*)\$\$)?/)
    if (innerMacro && macros.hasOwnProperty(innerMacro[1])) {
        const lineMock = '!run ' + (innerMacro[3] ? innerMacro[1] + ' ' + innerMacro[3] : innerMacro[1])
        const clientMock = {
            isMock: true,
            say: (_, res) => {
                res = isNaN(parseFloat(res)) ? `"${res}"` : res
                runScript(line.replace(innerMacro[0], res))
            }
        }
        run(clientMock, '', '', lineMock)
    } else {
        runScript(line)
    }
}

var addMacro = function(name, script, callback) {
    if (!['_', '+', '*'].includes(name[0])) {
        callback('error: macro names must begin with \'+\',\'*\', or \'_\'')
        return
    }
    if (script.split(' ').includes(name)) {
        callback('error: recursion not allowed in macros')
        return
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
    client.say(channel, macros[line.split(' ')[1]])

const listMacros = (client, channel, from, line) =>
    client.say(channel, Object.keys(macros).join(' '))

app.get('/list-macros', (req, res) => {
    res.json(Object.keys(macros))
})

var replaceAll = function(string, target, replace) {
    return string.replace(new RegExp(target, 'g'), replace);
}

module.exports = {
    name: "eval in a sandbox", //not required atm iirc 
    commands: {
        "!run": run,
        '!addmacro': newMacro,
        '!delmacro': delMacro,
        '!printmacro': printMacro,
        '!listmacros': listMacros
    },
    init: init
}
