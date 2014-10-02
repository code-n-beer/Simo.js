var janko = function(client,channel,from,line){
    console.log(line);
    var ret = "Hei " + from + "! HAISTA VITTU!";
    client.say(channel,ret);
}

module.exports = {
    name: "janko",
    commands: {
        "!janko": janko
    }
}