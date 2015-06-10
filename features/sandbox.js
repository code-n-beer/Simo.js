var Sandbox = require('sandbox');
//client is used to send stuff
//channel is needed to send stuff using client, but is also the channel's name where the line came from
//line is the full message the user sent
//from is the nick of the user who sent the line
var run= function(client, channel, from, line){
    //console.log(line); //debug
    var s = new Sandbox();
    s.run(line, function(output) {
        client.say(channel, output.result); 
    });
    
}

module.exports = {
    name: "eval in a sandbox", //not required atm iirc 
    commands: { 
       "!run": run,
    }
}
