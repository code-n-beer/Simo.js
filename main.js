var irc = require('irc');

var fs = require('fs');

var features = require('./features/index.js').enabledFeatures;
var commands = features.commands;
var inits = features.inits;
var regexes = features.regexes;

var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

var server,channel,nick,username,password,port;
var config = {
    server: settings.general.server,
    channel: settings.general.channel,
    botnick: settings.general.botnick,
    username: settings.general.username,
    password: settings.general.password,
    port: settings.general.port,
    websocketport: settings.general.websocketport,
};

var client = new irc.Client(config.server, config.botnick, {
    channels: [config.channel],
    port: config.port,
    autoConnect: false,
    password: config.password,
    userName: config.username
});

client.addListener('raw', function(message) {
    //console.log(message);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

for(var init in inits)
{
    inits[init](config);
}

var logger = require('./features/simoOnFire.js').loggingAction;

client.addListener('message', function(from, to, message) {
    //console.log("from: " + from);
    //console.log("to: " + to);
    //console.log("message: " + message);
    require('./features/simoOnFire.js').loggingAction(from, to, message, commands);

    var msg = message.toLowerCase();
    if(msg.indexOf("penis") != -1)
    {
        client.say(to, ":D");
    }

    //In case of a query, send the msg to the querier instead of ourselves
    if(to.indexOf("#") === -1) {
        to = from;
    }

    try {
        var cmd = msg.split(" ")[0];
        if(commands.hasOwnProperty(cmd))
        {
            var functions = commands[cmd];
            //console.log("functions: " + functions);
            functions.forEach(function(func) {
                func(client, to, from, message);
            });
        }
        }
    catch (err) {
        console.log(err);
    }
    try {
        Object.keys(regexes).forEach(function(key) {
                var regex = new RegExp(key);
                if(message.match(regex))
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
});

client.connect();

// Start twitter stream on connect
setTimeout(
    commands['!twitter'][0](client, config.channel, "startup", ""),
    3000);
