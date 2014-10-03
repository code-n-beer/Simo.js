var janko = function(client,channel,from,line){
    console.log(line);

    var nick = line.split(" ")[1];
    var ret;

    if(nick){
        ret = "Hei " + nick + "! HAISTA VITTU!";
    } else {
        ret = "Hei " + from + "! HAISTA VITTU!";
    }

    client.say(channel,ret);
}

module.exports = {
    name: "janko",
    commands: {
        "!janko": janko
    }
}
