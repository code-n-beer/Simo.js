var irc = require('irc');

var fs = require('fs');
var _ = require('underscore');
const macroPath = __dirname + '/lib/macros.js'

var features = require('./features/index.js').enabledFeatures;
var commands = features.commands;
var inits = features.inits;
var regexes = features.regexes;

var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

var TimerPoller = require('./lib/timerpoller').TimerPoller;
var MultiCommand = require('./lib/multicommand').MultiCommand;
var UrlTitle = require('./lib/urltitle').UrlTitle;

var server,channel,nick,username,password,port;
var config = {
    server: settings.general.server,
    channel: settings.general.channel,
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
    channels: [config.channel],
    port: config.port,
    autoConnect: false,
    password: config.password,
    userName: config.username
});

client.addListener('raw', function(message) {
    console.log(message);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

for(var init in inits)
{
    inits[init](config, client);
}

var logger = require('./features/simoOnFire.js').loggingAction;
var multicommand = new MultiCommand(commands, 100);
var urltitle = new UrlTitle();

client.addListener('message', function(from, to, message) {
    //console.log("from: " + from);
    //console.log("to: " + to);
    //console.log("message: " + message);
    require('./features/simoOnFire.js').loggingAction(from, to, message, commands);

    var msg = message.toLowerCase();
    //In case of a query, send the msg to the querier instead of ourselves
    if(to.indexOf("#") === -1) {
        to = from;
    }
    // Enough of this shit
    if(from == config.botnick) {
        return;
    }

    try {
        Object.keys(regexes).forEach(function(key) {
                var regex = new RegExp(key);
                {
                    for(var i = 0; i < regexes[key].length; i++)
                    {
                        regexes[key][i](client, to, from, message);
                    }
                }
        });
    }

    catch(err){
        console.log(err);
    }
    try {

        if(msg.indexOf('!') !== 0) {
            urltitle.getTitle(message, function(title) {
                if(!title) {
                    return;
                }
                client.say(to, title);
            });
            return; //this broke regexes btw
            // ok
        }
        // hypermacros
        if(~message.indexOf('!*')) {
          const macroFile = fs.readFileSync(macroPath);
          macros = JSON.parse(macroFile);
          message = macrofy(message, 0)

          function macrofy(msg, depth) {
            if(depth > 100) return "stack level too deep, giving up"
            if(!~msg.indexOf('!*')) return msg
            return macrofy(msg.split(' ').map(word => {
              const cmd = word.slice(1)
              return cmd.indexOf('*') === 0
                ? macros.hasOwnProperty(cmd)
                  ? macros[cmd].split(' ').map(macro =>
                    macros.hasOwnProperty(macro) ? '!' + macro : macro
                  ).join(' ')
                  : `{Unknown hypermacro: ${cmd}}`
                : word
            })
            .join(' '), depth + 1)
          }
        }
          
        multicommand.exec(to, from, message, function(result) {
            if(!result)
                return;
            client.say(to, result);
        });

        }
    catch (err) {
        console.log(err);
    }
});

client.connect(function() {
    new TimerPoller(client, 30);
});

// Start twitter stream on connect
setTimeout(
    () => commands['!twitter'][0](client, config.channel, "startup", ""),
    3000);
// ^ nice.

