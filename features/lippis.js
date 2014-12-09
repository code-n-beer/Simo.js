var init = function(config){
}

var lippis = function(client, channel, from, line){
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
        "mitä\S* tekis\?": lippis,
        "mitä\S*( mä )?tekis": lippis,
        "^mitä tekis$": lippis,
        "tiiä mitä tekis\??$": lippis,
        "että mitä tekis\??$": lippis,
        "et mitä tekis\??$": lippis,
        "^mitä tekis\??.*": lippis,
    },
}
