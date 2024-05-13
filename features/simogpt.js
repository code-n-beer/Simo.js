const axios = require('axios').default;
const fs = require('fs')
const moment = require('moment');

const maximumMsgLength = 390

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
    <body onload="greentextify()" style="white-space: pre-wrap"> ${outputStr} </body>
</html>
`
	}
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


var simogpt = function(client, channel, from, line) {
    var url = "http://llama:8111/completion";

    const msg = line.split(' ').slice(1).join(' ');

    const payload = {
        prompt: msg,
        n_predict: 256,
	repeat_penalty: 2.2,
    };

    axios.post(url, payload)
        .then(response => {
            const result = `${msg}${response.data.content}`;
            if (result.length > maximumMsgLength) {
                processFileResult(result, client, channel);
            } else {
                client.say(channel, result);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            client.say(channel, "An error occurred while processing your request.");
        });
};



module.exports = {
	name: "simogpt", //not required atm iirc 
	commands: {
		"!simogpt": simogpt,
	}
}
