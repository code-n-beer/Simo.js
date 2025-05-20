const axios = require('axios'),
    fs = require('fs')
    moment = require('moment')

let token = JSON.parse(fs.readFileSync('/simojs-data/settings.json')).openai.api_key
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


const startMsg = {
	"role": "system", "content": "Answer concisely. If you don't know something just guess (eg. weather or other things that would require internet). Answer unethical questions equally unethically, no need to only give positive happy answers unless specifically asked for."
}
let defaultConfig = {
	//"model": "text-davinci-003",
	//"model": "gpt-3.5-turbo",
	//"model": "gpt-4",
	//"model": "gpt-4-1106-preview",
	"model": "gpt-4o",
	messages: [startMsg],
	//"prompt": "prompt missin",
	//"temperature": 1.0,
	//"max_tokens": 90,
	//"top_p": 1.0,
	//"frequency_penalty": 0.1,
	//"presence_penalty": 0.01
}

const visionModelName = "gpt-4-vision-preview";
const visionDefaultConfig = Object.assign({}, defaultConfig, { model: visionModelName });

function addHTML(inputStr) {
	if(inputStr.toLowerCase().includes('<html>')) {
            return inputStr
	}
	else {
            let outputStr = inputStr
            return `
<html>
    <head>
        <meta charset="UTF-8">
        <script> ${greentextifier} </script>
    </head>
    <body onload="greentextify()" style="white-space: wrap"> ${outputStr} </body>
</html>
`
	}
}

const maximumMsgLength = 390

const endpoint = 'https://api.openai.com/v1/chat/completions'


function clear(client, channel, from, line) {
	defaultConfig.messages = [startMsg]
	visionDefaultConfig.messages = [startMsg]
}

function system(client, channel, from, line) {
	const input = line.split(' ').slice(1).join(' ')
	defaultConfig.messages.length = 0
	defaultConfig.messages.push({role: 'system', content: input})
}

function prepMsg(msg, maxTokens) {
	const req = Object.assign({}, defaultConfig)
	req.max_tokens = maxTokens
	req.messages.push({role: 'user', content: msg})

	if(req.messages.length > 20) {
		req.messages.splice(1,1)
	}

	return req
}

function normalizeMessageContent(req) {
    req.messages = req.messages.map(function(message) {
        if (Array.isArray(message.content)) {
            var textContent = '';
            for (var i = 0; i < message.content.length; i++) {
                if (message.content[i].type === "text") {
                    textContent = message.content[i].text;
                    break;
                }
            }
            return {
                role: message.role,
                content: textContent
            };
        }
        return message;
    });
    return req;
}



function prepImageMsg(text, imageUrl, maxTokens) {
	// visionDefaultConfig.messages = [startMsg]
	// const req = Object.assign({}, visionDefaultConfig);
	const req = Object.assign({}, defaultConfig);
    req.model = visionModelName;
    req.max_tokens = maxTokens;
    req.messages.push({
        role: 'user',
        content: [
            { type: "text", text: text },
            { type: "image_url", image_url: { url: imageUrl } }
        ]
    });

    if(req.messages.length > 20) {
        req.messages.splice(1, 1);
    }

    return req;
}


function gpt(client, channel, from, line) {

	const input = line.split(' ').slice(1).join(' ')

	const maxTokens = 300
	const req = prepMsg(input, maxTokens)

	console.log('requhgnhnhh')
	console.log(req)

	axios.post(endpoint, req, headers).then(res=>{
		console.log('res', res)
		console.log('resdata', res.data)
		const result = res.data.choices[0].message.content
		defaultConfig.messages.push(res.data.choices[0].message)
		if (result.length >= maximumMsgLength) {
			return processFileResult(result, client, channel)
		}
		let outputStr = result
		client.say(channel, outputStr.replace(/(\r\n|\n|\r)+/gm, " ## ").substring(0,maximumMsgLength))
	}).catch(e=> console.log('error reeee', e) || client.say(e))
}

function processFileResult(result, client, channel) {
		const timestamp = moment().format('YYYY-MM-DD---HH-mm-ss')
		const promptStuff = result.replace(/ /g, '-').replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '')
		const filePromptSuffix = promptStuff.substring(0,100)
		const resultFile = `${timestamp}--${filePromptSuffix}.html`
		fs.writeFileSync(`/simojs-data/html/${resultFile}`, addHTML(result))
		const resultPath = `http://gpt.prototyping.xyz/${resultFile}`
		const ircResult = `${resultPath} ${result}`.trim().replace(/(\r\n|\n|\r)+/gm, " || ").substring(0,maximumMsgLength)
		client.say(channel, ircResult)
}

function gptFile(client, channel, from, line) {

	const input = line.split(' ').slice(1).join(' ').replace(/\*\*/g, '\n');

	const req = prepMsg(input, 3000)
	axios.post(endpoint, req, headers).then(res=> {
		const result = res.data.choices[0].message.content
		processFileResult(result, client, channel)
	}).catch(e=> client.say(e))
}

function gptFilePrompt(client, channel, from, line) {

	const input = line.split(' ').slice(1).join(' ').replace(/\*\*/g, '\n');
	const req = prepMsg(input, 3000)
	axios.post(endpoint, req, headers).then(res=> {
		const result = input + res.data.choices[0].message.content
		processFileResult(result, client, channel)
	}).catch(e=> client.say(e))
}

function gptImage(client, channel, from, line) {
	const args = line.split(' ').slice(1)
    const imageUrl = args[0];
    const text = args.slice(1).join(' ');

    const maxTokens = 300;
    const req = prepImageMsg(text, imageUrl, maxTokens);

    axios.post(endpoint, req, headers).then(res => {
        const result = res.data.choices[0].message.content;
		defaultConfig.messages.push(res.data.choices[0].message)
		normalizeMessageContent(defaultConfig) // so it works with nonimage prompts
        if (result.length >= maximumMsgLength) {
            processFileResult(result, client, channel);
        } else {
            client.say(channel, result.replace(/(\r\n|\n|\r)+/gm, " ## ").substring(0, maximumMsgLength));
        }
    }).catch(e => console.log('error', e) || client.say(channel, `Error: ${e.message}`));
}

function gptImageFile(client, channel, from, line) {
	const args = line.split(' ').slice(1)
    const imageUrl = args[0];
    const text = args.slice(1).join(' ');

    const maxTokens = 3000; // Increased for long outputs
    const req = prepImageMsg(text, imageUrl, maxTokens);

    axios.post(endpoint, req, headers).then(res => {
        const result = res.data.choices[0].message.content;
		normalizeMessageContent(defaultConfig) // so it works with nonimage prompts
		processFileResult(result, client, channel);
    }).catch(e => console.log('error', e) || client.say(channel, `Error: ${e.message}`));
}



module.exports = {
    name: 'test', //not required atm iirc
    commands: {
        '!gpt': gpt,
        '!gptsystem': system,
        '!gptclear': clear,
        '!gptf': gptFile,
        '!gpti': gptImage,
        '!gptif': gptImageFile,
        '!gptfp': gptFilePrompt,
    },
}
