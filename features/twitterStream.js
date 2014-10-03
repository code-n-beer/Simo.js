var Stream = require('user-stream');

var fs = require('fs');
var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

var stream = new Stream({
    consumer_key: settings.twitter.consumer_key,
    consumer_secret: settings.twitter.consumer_secret,
    access_token_key: settings.twitter.access_token_key,
    access_token_secret: settings.twitter.access_token_secret
});

var streamActive = false;

var twitter = function(client, channel, from, line){
    var msg = line.split(" ")[1];
    if(msg == "stop" && streamActive) {
        stream.destroy();
        streamActive = false;
        return;
    }

    if(streamActive) {
        client.say(channel, "Twitter stream is already open");
        return;
    }

    stream.stream();

    client.say(channel, "Opened twitter stream")
        streamActive = true;
    stream.on('data', function(json) {
        try {
            // Don't read own tweets!
            if(json.user.id != 1220480214){
                var user = json.user.screen_name;
                var tweet = json.text;
                client.say(channel, "Tweet from " + user + ": " + tweet);
            }
        }
        catch (err) {
            console.log("Twitterstream: " + err);
        }
    });

    stream.on('close', function() {
        client.say(channel, "Twitter stream closed");
        streamActive = false;
    });

    stream.on('error', function() {
        client.say(channel, "Twitter stream error!");
        streamActive = false;
    });
}

module.exports = {
    name: "twitter", //not required atm iirc 
    commands: { 
        "!twitter": twitter,
    }
}
