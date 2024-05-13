const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');


function fixResult(r) {
	let result = Object.assign({}, r.data)
	result.output = result.output.replace('\n', '|').substr(0, 300)
	result.filename = 'http://gpt.prototyping.xyz/' + result.filename
	return result
}

var gptfi = function(client, channel, from, line) {
	var url = "http://ml-simo:8765/gpt";

	const msg = line.split(' ').slice(1).join(' ')

	const payload = { 
		prompt: msg,
		translate: true
	}

	axios.post(url, payload).then(r => { // should convert to json automatically
		console.log('recv gpt')
		let output = fixResult(r)
		//client.say(channel, JSON.stringify(output));
		client.say(channel, output.filename + " " + output.output);
	})
}

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

var gptNoPrompt = function(client, channel, from, line) {
	var url = "http://ml-simo:8765/gpt";

	const msg = line.split(' ').slice(1).join(' ')

	const payload = { 
		prompt: msg
	}

	axios.post(url, payload).then(r => { // should convert to json automatically
		console.log('recv gpt')
		let output = fixResult(r)
		client.say(channel, output.output.replace(msg, ""));
	})
}

var gptJson = function(client, channel, from, line) {
	var url = "http://ml-simo:8765/gpt";
	const msg = line.split(' ').slice(1).join(' ')
	let payload = {}
	try {
		payload = JSON.parse(msg) // should convert automatically
	}
	catch(e) {
		client.say(channel, "JSON parse crashed")
	}
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
		"!gptfi": gptfi,
		"!gptnoprompt": gptNoPrompt,
		"!gptjson": gptJson
	}
}
