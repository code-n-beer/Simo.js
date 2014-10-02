

/*
 *   COPY THIS FILE TO CREATE YOUR OWN FEATURE 
 *   DON'T PUT YOUR FEATURE WITHIN THIS FILE
 */
var count = 0;
//client is used to send stuff
//channel is needed to send stuff using client, but is also the channel's name where the line came from
//line is the full message the user sent
//from is the nick of the user who sent the line
var hello = function(client, channel, from, line){
    //console.log(line); //debug
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
