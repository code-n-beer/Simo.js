var main = function(client, channel, from, line) {
    var script = line.slice("!eval ".length);

    var result = eval(script);

    client.say(channel, result.toString());
}

module.exports = {
    name: "eval",
    /*
    commands: { 
       "!eval": main,
    }
    */
}