var irc = require('irc');

var fs = require('fs');

var features = require('./features/index.js').enabledFeatures;
var commands = features.commands;
var inits = features.inits;
var regexes = features.regexes;

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


client.addListener('message', function(from, to, message) {
    //console.log("from: " + from);
    //console.log("to: " + to);
    //console.log("message: " + message);
    if (message[0] === '!') {

      var wanhat = ["!expl", "!horos", "!lastfm", "!mötö", "!unmötö", "!niksi",
      "!r", "!uc", "!weather", "!uguu", "!add", "!remove", "!c", "!pizza", "!tweet", "!np"];

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

    var cmd = msg.split(" ")[0];
    if(commands.hasOwnProperty(cmd))
    {
        var functions = commands[cmd];
        //console.log("functions: " + functions);
        functions.forEach(function(func) {
            func(client, to, from, message);
        });
    }
    Object.keys(regexes).forEach(function(key) {
        //Object.keys(regexes[obj]).forEach(function (key) {
            var regex = new RegExp(key);
            //if(regex.indexOf(message) !== -1)
            if(message.match(regex))
            {
                for(var i = 0; i < regexes[key].length; i++)
                {
                    regexes[key][i](client, to, from, message);
                }
            }
        //});
    });
});

client.connect();

// Start twitter stream on connect
setTimeout(
    commands['!twitter'][0](client, config.channel, "startup", ""),
    3000);
