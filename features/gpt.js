const axios = require('axios');

var gpt = function(client, channel, from, line) {
	var url = "http://ml-simo:8765/gpt";

    const msg = line.split(' ').slice(1).join(' ')

	const payload = { 
		prompt: msg
	}
	
	axios.post(url, payload).then(r => { // should convert to json automatically
		console.log('recv gpt')
        let output = fixResult(r)
		//client.say(channel, JSON.stringify(output));
		client.say(channel, output.filename + " " + output.output);
	})
}

var gptJson = function(client, channel, from, line) {
	var url = "http://ml-simo:8765/gpt";
    const msg = line.split(' ').slice(1).join(' ')
	const payload = JSON.parse(msg) // should convert automatically
	axios.post(url, payload).then(r => {
        console.log('recv gpt')
        let output = fixResult(r)
        client.say(channel, JSON.stringify(output));
	})
}

module.exports = {
    name: "gpt", //not required atm iirc 
    commands: {
        "!gpt": gpt,
        "!gptjson": gptJson
    }
}
