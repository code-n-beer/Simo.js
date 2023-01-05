const axios = require('axios'),
    fs = require('fs')
    moment = require('moment')

let token = JSON.parse(fs.readFileSync('simojs-data/settings.json')).openai.api_key
let headers = {
	headers: {
		'Authorization': `Bearer ${token}`
	}
}

let greentextifier = `
function greentextify() {
    if (![...document.body.innerHTML].every(c => c !== "<")) return;
    const contents = document.body.innerHTML.split("\\n").map(item => { const c = item.match(/^(\\s+)?&gt;/) ? "greentext" : "normal"; return '<span class='+c+'>'+item+'</span>'; });
    const styles = '.greentext { display: block; color: green; margin-bottom: 0em }'; 
    const e = document.createElement("style"); 
    e.innerText = styles; 
    document.head.appendChild(e);
    document.body.innerHTML = contents.join("\\n");
	
}
`

let defaultConfig = {
	"model": "text-davinci-003",
	"prompt": "prompt missin",
	"temperature": 1.0,
	"max_tokens": 80,
	"top_p": 1.0,
	"frequency_penalty": 0.1,
	"presence_penalty": 0.01
}

function addHTML(inputStr) {
	if(inputStr.toLowerCase().includes('<html>')) {
		return inputStr
	}
	else {
		return `<html> <head> <script> ${greentextifier} </script> </head> <body onload="greentextify()" style="white-space: pre"> ${inputStr} </body>
			</html>`
	}
}

function gpt(client, channel, from, line) {

	const input = line.split(' ').slice(1).join(' ')

	const req = Object.assign({}, defaultConfig)
	req.max_tokens = 100
	req.prompt = input

	console.log('req', req.prompt)
	axios.post('https://api.openai.com/v1/completions', req, headers).then(res=>{
		const result = res.data.choices[0].text
		client.say(channel, result.replace(/(\r\n|\n|\r)+/gm, " || ").substring(0,250))
	}).catch(e=> client.say(e))
}

function gptFile(client, channel, from, line) {

	const input = line.split(' ').slice(1).join(' ').replace(/\*\*/g, '\n');
	const req = Object.assign({}, defaultConfig)
	req.max_tokens = 1500
	req.prompt = input
	console.log('req', req.prompt)
	const timestamp = moment().format('YYYY-MM-DD---HH-mm-ss')
	axios.post('https://api.openai.com/v1/completions', req, headers).then(res=> {
		const result = res.data.choices[0].text
		const promptStuff = input.replace(/ /g, '-').replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '')
		const filePromptSuffix = promptStuff.substring(0,100)
		const resultFile = `${timestamp}--${filePromptSuffix}.html`
		fs.writeFileSync(`/simojs-data/html/${resultFile}`, addHTML(result))
		const resultPath = `http://gpt.prototyping.xyz/${resultFile}`
		const ircResult = `${resultPath} ${result}`.trim().replace(/(\r\n|\n|\r)+/gm, " || ").substring(0,250)
		client.say(channel, ircResult)
	}).catch(e=> client.say(e))
}

function gptFilePrompt(client, channel, from, line) {

	const input = line.split(' ').slice(1).join(' ').replace(/\*\*/g, '\n');
	const req = Object.assign({}, defaultConfig)
	req.max_tokens = 1500
	req.prompt = input
	console.log('req', req.prompt)
	const timestamp = moment().format('YYYY-MM-DD---HH-mm-ss')
	axios.post('https://api.openai.com/v1/completions', req, headers).then(res=> {
		const result = input + res.data.choices[0].text
		const promptStuff = input.replace(/ /g, '-').replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '')
		const filePromptSuffix = promptStuff.substring(0,100)
		const resultFile = `${timestamp}--${filePromptSuffix}.html`
		fs.writeFileSync(`/simojs-data/html/${resultFile}`, addHTML(result))
		const resultPath = `http://gpt.prototyping.xyz/${resultFile}`
		const ircResult = `${resultPath} ${result}`.trim().replace(/(\r\n|\n|\r)+/gm, " || ").substring(0,250)
		client.say(channel, ircResult)
	}).catch(e=> client.say(e))
}

module.exports = {
    name: 'test', //not required atm iirc
    commands: {
        '!gpt': gpt,
        '!gptf': gptFile,
        '!gptfp': gptFilePrompt,
    },
}
