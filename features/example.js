

var count = 0;
var hello = function(client, channel, line){
    console.log(line);
    count++;
    var ret =  "Feature has been ran " + count + " times.";
    client.say(channel, ret); 
}

module.exports = {
    name: "test", //not required atm iirc 
    commands: { 
       "!test": hello,
    }
}
