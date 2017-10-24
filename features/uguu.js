var min = 2;
var max = 15;

var uguu = function(client, channel, from, line) {
    var nick = line.split(" ")[1];

    if (nick) {
        while (nick.match(/[aeiouAEIOU]$/i)) {
            nick = nick.slice(0, nick.length - 1);
        }
    } else {
        nick = "ug";
    }

    var uCount = min + Math.random() * (max - min);

    for (var i = 0; i < uCount; i++) {
        nick += "u";
    }

    nick += "~";

    client.say(channel, nick);
}

module.exports = {
    name: "uguu",
    commands: {
        "!uguu": uguu,
    }
}