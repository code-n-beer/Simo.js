var janko = function(client, channel, from, line) {
    console.log(line);

    var nick = line.split(" ")[1];
    var ret;

    if (nick) {
        ret = "Hei " + nick + "! HAISTA PASKA!";
    } else {
        ret = "Hei " + from + "! HAISTA PASKA!";
    }

    client.say(channel, ret);
}

module.exports = {
    name: "jankko",
    commands: {
        "!jankko": janko
    }
}