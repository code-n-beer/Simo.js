var init = function(config){
    console.log("lippis initd");
}

var lastmsg = "";

var lippis = function(client, channel, from, line){
    if(line === lastmsg)
        return;

    lastmsg = line;

    console.log("lippis ran");
    var msg = from + ": revi tuosta kaatuneesta koivusta tuohta ja tee lippis.";
    client.say(channel, msg); 
}

module.exports = {
    name: "lippis", //not required atm iirc 
    init: init,
    commands: { 
       "!lippis": lippis,
    },
    regexes: {
        ".*mitä(\\S)* tekis\\?.*": lippis,
        ".*mitäköhän tekis\\??.*": lippis,
        ".*mitä\\S* mä tekis.*": lippis,
        "^mitä tekis$": lippis,
        ".*tiiä mitä tekis\\??$": lippis,
        ".*että mitä tekis\\??$": lippis,
        ".*et mitä tekis\\??$": lippis,
        "^mitä tekis\\??.*": lippis,
    },
}
