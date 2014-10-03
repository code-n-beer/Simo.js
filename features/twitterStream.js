var Stream = require('user-stream');

var fs = require('fs');
var settings = fs.readFileSync('./settings.json');
settings = JSON.parse(settings);

var stream;

var newStream = function(){
    stream = new Stream({
        consumer_key: settings.twitter.consumer_key,
           consumer_secret: settings.twitter.consumer_secret,
           access_token_key: settings.twitter.access_token_key,
           access_token_secret: settings.twitter.access_token_secret
    });
}

var streamActive = false;

var twitter = function(client, channel, from, line){
    // Stopping twitter stream
    var msg = line.split(" ")[1];
    if(msg == "stop") {
        streamActive = false;
        stream.destroy();
        console.log("Twitterstream: Destroyed stream");
        return;
    } 

    // Check if stream already connected
    if(streamActive) {
        client.say(channel, "Twitter stream is already open");
        return;
    }

    // Open twitterstream
    newStream();
    stream.stream();

    // Post tweets when received
    stream.on('data', function(json) {
        try {
            // Don't read own tweets!
            if(json.user.id != 1220480214){
                var user = json.user.screen_name;
                var tweet = json.text;
                client.say(channel, "Tweet from @" + user + ": " + tweet);
            }
        }
        catch (err) {
            console.log("Twitterstream: " + err);
        }
    });

    stream.on('connected', function() {
        client.say(channel, "Twitter stream opened");
        console.log("Twitterstream: Connected");
        streamActive = true;
    });

    // If not closed on purpose, reopen stream
    stream.on('close', function() {
        if(streamActive){
            client.say(channel, "Twitter stream closed, trying to reopen");
            streamActive = false;
            stream.destroy();
            setTimeout(twitter(client, channel, from, line), 2000);
        } else {
            client.say(channel, "Twitter stream closed");
            streamActive = false;
        }
    });

    stream.on('error', function() {
        if(streamActive){
            client.say(channel, "Twitter stream , tryinr to reopen");
            r
            streamActive = false;
            stream.destroy();
            setTimeout(twitter(client, channel, from, line), 2000);
        } else {
            client.say(channel, "Twitter stream closed");
            streamActive = false;
        }
    });
}

module.exports = {
    name: "twitter", 
    commands: { 
        "!twitter": twitter,
    }
}
