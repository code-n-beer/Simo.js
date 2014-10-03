var usage = require('usage');

var sys_usage = function(client, channel, from, line) {
	usage.lookup(process.pid, function(err, result) {
		var ret = "Simo is using: " + result.cpu + "% of the CPU and " + result.memory/1000000 + "MB of memory."
		client.say(channel, ret);

	});
}

module.exports = {
    name: "usage",
    commands: { 
       "!cpu": sys_usage
    }
}