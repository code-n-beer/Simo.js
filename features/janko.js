var janko = function(client,channel,from,line){
    console.log(line);

    var ret;

    if(line.contains("SimoBot")
        && (line.contains("haista vittu") || line.contains("HAISTA VITTU"))){
        ret = "Asia kunnossa.";
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

// uli