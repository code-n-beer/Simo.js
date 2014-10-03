var irc = require('irc');

var fs = require('fs');

var features = require('./features/index.js').enabledFeatures;
var commands = features.commands;

var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

var server,channel,nick,username,password,port;
var config = {
    server: settings.general.server,
    channel: settings.general.channel,
    botnick: settings.general.botnick,
    username: settings.general.username,
    password: settings.general.password,
    port: settings.general.port
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


client.addListener('message', function(from, to, message) {
    console.log("from: " + from);
    console.log("to: " + to);
    console.log("message: " + message);
    var msg = message.toLowerCase();
    if(msg.indexOf("penis") != -1)
{
    client.say(to, ":D");
}

//In case of a query, send the msg to the querier instead of ourselves
if(to.indexOf("#") === -1) {
    to = from;
}

for(var command in commands)
{
    if(msg.indexOf(command) === 0)
{
    try{
        commands[command](client, to, from, message);
    }
    catch(err){
        client.say(to, "Command '" + command + "' crashed: " + err);
    }
}
}
});

<<<<<<< HEAD
client.connect();
=======
        for(var command in commands)
        {
            if(msg.indexOf(command) === 0)
            {
                try{
                    commands[command](client, to, from, message);
                }
                catch(err){
                    client.say(to, "Command '" + command + "' crashed: " + err);
                }
            }
        }
    });
>>>>>>> 1510d742c96622aa191e26da3b1a0a7c95577c55

