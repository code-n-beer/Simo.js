var random = function(client, channel, from, line) {
    var values = line.split(/[\s,-]+/);
    var low = 0;
    var high = 0;
    if (values[1] && isNaN(values[1])) {
        var helpstr = "Supported formats [x-y] [x y] [x, y] [x] or no values for 0-100";
        client.say(channel, helpstr);
        return;
    }

    if (values[1]) {
        high = values[1];
    } else {
        high = 100;
    }

    if (values[2] && !isNaN(values[2])) {
        low = Math.min(values[1], values[2]);
        high = Math.max(values[1], values[2]);
    }
    var value = Math.floor(Math.random() * (high - low + 1) + low).toString();

    client.say(channel, value);
}

var coinflip = function(client, channel, from, line) {
    var result = (Math.floor(Math.random() * 2) == 0) ? "Heads" : "Tails";
    client.say(channel, result);
}

module.exports = {
    name: "random",
    commands: {
        "!coinflip": coinflip,
        "!random": random, //returns random value, 0-100 if no attributes given
    }
}