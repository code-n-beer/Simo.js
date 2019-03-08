const irc = require('irc-upd');

const fs = require('fs');
const _ = require('underscore');
const macroPath = __dirname + '/lib/macros.js'

const features = require('./features/index.js').enabledFeatures;
var commands = features.commands;
var inits = features.inits;
var regexes = features.regexes;

var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

const MultiCommand = require('./lib/multicommand').MultiCommand;
const UrlTitle = require('./lib/urltitle').UrlTitle;

var config = {
    server: settings.general.server,
    channels: settings.general.channels,
    botnick: settings.general.botnick,
    username: settings.general.username,
    password: settings.general.password,
    port: settings.general.port,
    websocketport: settings.general.websocketport,
    wpuser: settings.wordpress.username,
    wppass: settings.wordpress.password,
    mailFileUrl: settings.email.fileUrl,
    mailFilePath: settings.email.filePath,
};

var client = new irc.Client(config.server, config.botnick, {
    debug: true,
    showErrors: true,
    channels: config.channels,
    port: config.port,
    autoConnect: true, 
    password: config.password,
    userName: config.username,
    millisecondsOfSilenceBeforePingSent: 30 * 1000,
    millisecondsBeforePingTimeout: 15 * 1000
});

client.addListener('raw', function(message) {
    //console.log(message);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

console.log("Starting feature initialization")
for (var init in inits) {
    inits[init](config, client);
    console.log(init + " initialized");
}
console.log("All features initialized");

var multicommand = new MultiCommand(commands, 100);
var urltitle = new UrlTitle();

client.addListener('message', function(from, to, message) {
    //console.log("from: " + from);
    //console.log("to: " + to);
    //console.log("message: " + message);

    var msg = message.toLowerCase();
    //In case of a query, send the msg to the querier instead of ourselves
    if (to.indexOf("#") === -1) {
        to = from;
    }
    // Enough of this shit
    if (from == config.botnick) {
        return;
    }

    try {
        Object.keys(regexes).forEach(function(key) {
            var regex = new RegExp(key); {
                for (var i = 0; i < regexes[key].length; i++) {
                    regexes[key][i](client, to, from, message);
                }
            }
        });
    } catch (err) {
        console.log(err);
    }
    try {

        if (msg.indexOf('!') !== 0) {
            console.log('going to call urltitle')
            urltitle.getTitle(message, function(title) {
                if (!title) {
                    return;
                }
                client.say(to, title);
            });
            message = `!*r ${to} ${from} ${message}`
        } else {
            message = `!*c ${to} ${from} ${message}`
        }

        // hypermacros
        if (~message.indexOf('!*')) {
            message = macrofy(message, 0)
            const macroFile = fs.readFileSync(macroPath);
            const macros = JSON.parse(macroFile)
            function macrofy(msg, depth) {
                if (depth > 100) return "stack level too deep, giving up"
                if (!~msg.indexOf('!*')) return msg
                return macrofy(msg.split(' ').map(word => {
                        const cmd = word.slice(1)
                        return cmd.indexOf('*') === 0 ?
                            macros.hasOwnProperty(cmd) ?
                            macros[cmd].split(' ').map(macro =>
                                macros.hasOwnProperty(macro) ? '!' + macro : macro
                            ).join(' ') :
                            `{Unknown hypermacro: ${cmd}}` :
                            word
                    })
                    .join(' '), depth + 1)
            }
        }

        multicommand.exec(to, from, message, function(result) {
            if (!result)
                return;
            client.say(to, result);
        });

    } catch (err) {
        console.log(err);
    }
});

// Start twitter stream on connect
setTimeout(
    () => commands['!twitter'][0](client, config.channels[0], "startup", ""),
    3000);
// ^ nice.
