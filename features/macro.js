

var macros = require(__dirname + '/../macros/index.js');
var fs = require('fs');
/*
 *   COPY THIS FILE TO CREATE YOUR OWN FEATURE 
 *   DON'T PUT YOUR FEATURE WITHIN THIS FILE
 */
var count = 0;
//client is used to send stuff
//channel is needed to send stuff using client, but is also the channel's name where the line came from
//line is the full message the user sent
//from is the nick of the user who sent the line
var new = function(client, channel, from, line){

    line = line.substring(line.substring('!macro '.length));

module.exports = {
  '_test': "exit('test')"
}

    client.say(channel, ret); 
}

module.exports = {
    name: "test", //not required atm iirc 
    commands: { 
       "!macro": new,
    }
}
