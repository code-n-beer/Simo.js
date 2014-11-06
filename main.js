var irc = require('irc');

var fs = require('fs');
var _  = require('underscore');
var async  = require('async');
var request = require('request');
var qs = require('querystring');


var features = require('./features/index.js').enabledFeatures;
var commands = features.commands;
var inits = features.inits;
var regexes = features.regexes;

var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

var TimerPoller = require('./lib/timerpoller').TimerPoller;

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
        var msgArr = msg.split(" ");
        if(cmd.indexOf('!') !== 0) {
          return;
        }
        
        // HANDLE DEM MSGS
        // (move this to a reasonable place)
        async.whilst(function() {
          return msgArr[0].indexOf('!') === 0;
        }, function(callback) {
          if(_.last(msgArr).indexOf('!') === -1) {
            msgArr[msgArr.length - 2] =  _.last(msgArr, 2).join(" ");
            msgArr = _.initial(msgArr);
            callback();
            return;
          }
          message = _.last(msgArr);
          cmd = message.split(" ")[0];
          var client1 = {
            say: function(chan, msg) {
                  msgArr[msgArr.length - 1] = msg;
                  callback();
                }
          }

          // SIMO.JS FEATURES
          if(commands.hasOwnProperty(cmd))
          {
              var functions = commands[cmd];
              //console.log("functions: " + functions);
              functions.forEach(function(func) {
                  func(client1, to, from, message);
              });
          } else {
            // PYTHON SIMO FEATURES
            var url = "http://localhost:8888";
            var post_data = qs.stringify({ command: message });
            request.post({url:url, body:post_data}, function(e, r, body) {
              if(e) {
                console.log('main:', e);
                client1.say(to, 'fail');
                return;
              }
              if(!body) {
                client1.say(to, '');
                return;
              }
              client1.say(to, body);
            });
          }
        }, function() {
          client.say('#simobot', msgArr);
          return;
        });

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

client.connect(function() {
    new TimerPoller(client, 30);
});

// Start twitter stream on connect
setTimeout(
    commands['!twitter'][0](client, config.channel, "startup", ""),
    3000);
// ^ nice.
