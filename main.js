var irc = require('irc');

var lineReader = require('line-reader');
var features = require('./features/index.js').enabledFeatures;
var commands = features.commands;

var server,channel,nick,username,password,port;
var config = {
    server: "",
    channel: "",
    botnick: "",
    username: "",
    password: "",
    port: 0 
};

var loaded = false;

var confs = ["server", "channel", "botnick", "username", "password", "port"];

lineReader.eachLine('settings.cfg', function(line, last) {
    console.log("line: " + line);
    for(var conf in confs)
    {
        /*
        if(line.lastIndexOf("port",0) === 0)
        {
            config.port = int(line.split("=")[1].trim();
        }
        */
        if(line.lastIndexOf(confs[conf],0) === 0)
        {
            //var c = line.split("=")[0];
            //c = c.trim();
            var val = line.split("=")[1];
            val = val.trim();
            config[confs[conf]] = val;
            console.log(confs[conf] + " = " + val);
            //confs.splice(confs.indexOf(confs[confs], 1));
            break;
        }
        /*
        if(confs.length <1 ) {
            main();
            return false;
        }
        */
    }
}).then(function () {
    loaded=true;
});

(function wait(){
    if(!loaded) {setTimeout(wait, 500);}
    else {main();}
})();

function main() {
    console.log("moi");
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
        console.log("from: " + from);
        console.log("to: " + to);
        console.log("message: " + message);
        var msg = message.toLowerCase();
        if(msg.indexOf("penis") != -1)
        {
            client.say(to, ":D");
        }

        for(var command in commands)
        {
            if(msg.indexOf(command) === 0)
            {
                commands[command](client, to, from, message);
            }
        }
    });

    client.connect();
}
