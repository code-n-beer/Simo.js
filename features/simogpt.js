const axios = require('axios').default;
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Readable } = require('stream');

const maximumMsgLength = 390;
// Use environment variable or default to a path in the container
const HTML_TEMPLATE_PATH = '/templates/streaming.html';
const OUTPUT_DIR = '/simojs-data/html';

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


async function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

async function startStreamingResponse(prompt, client, channel) {
    try {
        // Ensure output directory exists
        await ensureDirectoryExists(OUTPUT_DIR);
        
        const timestamp = moment().format('YYYY-MM-DD---HH-mm-ss');
        const promptSlug = prompt.replace(/ /g, '-').replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '').substring(0, 100);
        const baseFilename = `${timestamp}--${promptSlug}`;
        const htmlFile = `${baseFilename}.html`;
        const txtFile = `${baseFilename}.txt`;
        
        const htmlPath = path.join(OUTPUT_DIR, htmlFile);
        const txtPath = path.join(OUTPUT_DIR, txtFile);
        
        console.log(`Template path: ${HTML_TEMPLATE_PATH}`);
        console.log(`Output directory: ${OUTPUT_DIR}`);
        console.log(`Creating files: ${htmlPath} and ${txtPath}`);
        
        // Read template file
        let htmlContent;
        try {
            // Read the template file from mounted volume
            console.log(`Reading template from: ${HTML_TEMPLATE_PATH}`);
            htmlContent = fs.readFileSync(HTML_TEMPLATE_PATH, 'utf8');
            console.log('Successfully read template file');
        } catch (err) {
            console.error(`Error reading template file (${HTML_TEMPLATE_PATH}):`, err);
            // Fallback to a basic template if file read fails
            htmlContent = `<!DOCTYPE html><html><head><title>Streaming Response</title><style>body{font-family:monospace;white-space:pre-wrap;padding:20px;}</style></head><body><div id="content"></div><script>setInterval(()=>fetch(window.location.href.replace(/\.html$/,'.txt')).then(r=>r.text()).then(t=>document.getElementById('content').textContent=t),100)</script></body></html>`;
            console.log('Using fallback template');
        }
        
        // Write files
        fs.writeFileSync(htmlPath, htmlContent);
        fs.writeFileSync(txtPath, '');
        
        console.log(`Successfully created files at ${htmlPath} and ${txtPath}`);
        
        const resultUrl = `http://gpt.prototyping.xyz/${htmlFile}`;
        console.log(`Result URL: ${resultUrl}`);
        
        return {
            htmlPath,
            txtPath,
            resultUrl
        };
    } catch (error) {
        console.error('Error in startStreamingResponse:', error);
        throw error;
    }
}

function appendToFile(filePath, content) {
    fs.appendFileSync(filePath, content, 'utf8');
}


async function streamLLMResponse(prompt, filePath) {
    const url = "http://llama:8111/completion";
    
    const payload = {
        prompt: prompt,
        n_predict: 128,
        repeat_penalty: 2.2,
        stream: true
    };

    console.log(`Starting LLM streaming to ${filePath}`);
    
    try {
        // Write the prompt with styling
        const completionMarker = "\n[STREAM_COMPLETE]\n";
        const styledPrompt = `[PROMPT]${prompt}[/PROMPT]`;
        
        // Write the prompt with styling markers
        fs.writeFileSync(filePath, styledPrompt);
        
        const response = await axios({
            method: 'post',
            url: url,
            data: payload,
            responseType: 'stream',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return new Promise((resolve, reject) => {
            let buffer = '';
            
            // Create a write stream to append to the file
            const writeStream = fs.createWriteStream(filePath, { flags: 'a' });
            
            response.data.on('data', (chunk) => {
                try {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Save incomplete line for next chunk
                    
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        try {
                            if (line.startsWith('data: ')) {
                                const data = line.substring(6).trim();
                                if (data === '[DONE]') continue;
                                
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    // Write to the file
                                    writeStream.write(parsed.content, 'utf8');
                                    console.log('Appended chunk:', JSON.stringify(parsed.content));
                                }
                            }
                        } catch (e) {
                            console.error('Error processing line:', line, 'Error:', e);
                        }
                    }
                } catch (e) {
                    console.error('Error processing chunk:', e);
                }
            });

            response.data.on('end', () => {
                console.log('LLM stream ended');
                // Write completion marker
                writeStream.write(completionMarker, 'utf8', () => {
                    writeStream.end();
                    resolve();
                });
            });

            response.data.on('error', (err) => {
                console.error('Stream error:', err);
                // Still write completion marker on error
                writeStream.write(completionMarker, 'utf8', () => {
                    writeStream.end();
                    reject(err);
                });
            });
            
            // Handle process termination
            process.on('SIGINT', () => {
                writeStream.write(completionMarker, 'utf8', () => {
                    writeStream.end();
                    process.exit();
                });
            });
        });
    } catch (error) {
        console.error('Error in streamLLMResponse:', error);
        // If we get here, the file might be in an inconsistent state
        try {
            fs.appendFileSync(filePath, "\n[STREAM_COMPLETE]\n", 'utf8');
        } catch (e) {
            console.error('Failed to write completion marker:', e);
        }
        throw error;
    }
}

var simogpt = async function(client, channel, from, line) {
    const msg = line.split(' ').slice(1).join(' ');
    
    try {
        // Start streaming response - this creates the HTML file and returns the URL
        const { txtPath, resultUrl } = await startStreamingResponse(msg, client, channel);
        
        // Send the URL to the IRC channel immediately
        client.say(channel, resultUrl);
        console.log(`Started streaming response to ${resultUrl}`);
        
        // Start the LLM streaming in the background
        streamLLMResponse(msg, txtPath)
            .then(() => {
                console.log(`Finished streaming response to ${resultUrl}`);
            })
            .catch(error => {
                console.error('Error in streaming response:', error);
                client.say(channel, `Error streaming response: ${error.message}`);
            });
            
    } catch (error) {
        console.error('Error in simogpt:', error);
        client.say(channel, "An error occurred while processing your request.");
    }
};

var simoq = function(client, channel, from, line) {
    var url = "http://llama:8111/completion";

    const msg = line.split(' ').slice(1).join(' ');

    const payload = {
        prompt: msg,
        n_predict: 128,
	repeat_penalty: 3.2,
    };

    axios.post(url, payload)
        .then(response => {
	    let result = `${response.data.content}`;
            result = result.trim().replace(/(\r\n|\n|\r)+/gm, " # ").trim().substring(0,maximumMsgLength);
            client.say(channel, result);
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
		"!simoq": simoq,
	}
}
