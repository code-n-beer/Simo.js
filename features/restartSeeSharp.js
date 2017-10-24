var exec = require('child_process').exec;
var path = require('path');

var count = 0;
var hello = function(client, channel, from, line) {
    console.log('gdfsjkhfdgadg');
    var restartPath = path.join(__dirname, '../../rebootSimoSee');
    console.log('reboot path ' + path);
    console.log(__dirname);
    console.log(restartPath);
    exec(restartPath, function(err, stdout, stderr) {
        console.log(err);
        console.log(stdout);
        console.log(stderr);
    });
    var ret = "rebooted";
    client.say(channel, ret);
}

module.exports = {
    name: "test", //not required atm iirc 
    commands: {
        "!reboot": hello,
    }
}