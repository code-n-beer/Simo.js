var exec = require('child_process').exec;
var path = require('path');

var count = 0;
var hello = function(client, channel, from, line){
   exec(path.join(__dirname, '../../rebootSimoSee'));
    var ret =  "rebooted";
    client.say(channel, ret); 
}

module.exports = {
    name: "test", //not required atm iirc 
    commands: { 
       "!reboot": hello,
    }
}
