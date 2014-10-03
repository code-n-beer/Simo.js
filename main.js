var irc = require('irc');

var fs = require('fs');

var features = require('./features/index.js').enabledFeatures;
var commands = features.commands;

var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

var Firebase = require("firebase");
var simoOnFire = new Firebase("https://simocmds.firebaseio.com");

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
    //console.log(message);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});


client.addListener('message', function(from, to, message) {
    //console.log("from: " + from);
    //console.log("to: " + to);
    //console.log("message: " + message);
    if (message[0] === '!') {

      var wanhat = ["!expl", "!horos", "!lastfm", "!mötö", "!unmötö", "!niksi",
      "!r", "!uc", "!weather", "!uguu", "!add", "!remove", "!c", "!pizza", "!tweet"];

      var cmd = message.split(" ")[0];
      if (commands[cmd] !== undefined || wanhat.indexOf(cmd) !== -1) {
        function checkIfCmdInFirebase(input) {
          simoOnFire.child(input).on("value", function(val) {
            return (val.val() !== null);
          });
        }

        function createEntryToFirebase(comm) {
          var obj = {};
          obj[comm] = 1;
          simoOnFire.set(obj);
        }

        function updateEntryInFirebase(comm) {
          simoOnFire.child(comm).once("value", function(val) {
            var obj = {};
            obj[comm] = val.val()+1;
            simoOnFire.update(obj);
          });
        }

        if (checkIfCmdInFirebase(cmd)) {
          createEntryToFirebase(cmd);
        } else {
          updateEntryInFirebase(cmd);
        }
      }
    }

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

client.connect();
