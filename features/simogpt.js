const axios = require('axios').default;
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Readable } = require('stream');

const maximumMsgLength = 390;
// Use environment variable or default to a path in the container
const HTML_TEMPLATE_PATH = '/templates/streaming.html';
const OUTPUT_DIR = '/simojs-data/html';
const LATEST_FILE = path.join(OUTPUT_DIR, 'latest.txt');

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
    // Also append to latest.txt
    fs.appendFileSync(LATEST_FILE, content, 'utf8');
}

/**
 * Stops the first-started (oldest) LLM stream in the queue.
 */
function stopSimo() {
    // Get the oldest stream from the front of the queue.
    const streamToStop = activeStreamQueue.shift();

    if (!streamToStop) {
        console.log("!stopsimo called, but no active streams to stop.");
        return;
    }

    console.log(`Stopping stream for file: ${streamToStop.filePath}`);

    // Cancel the axios HTTP request.
    streamToStop.cancelSource.cancel('Stream stopped by external command.');

    // Write a cancellation marker to the files and end the streams.
    const cancellationMarker = "\n[STREAM_CANCELLED_BY_USER]\n[STREAM_COMPLETE]\n";
    
    if (streamToStop.writeStream && !streamToStop.writeStream.destroyed) {
        streamToStop.writeStream.write(cancellationMarker, 'utf8', () => streamToStop.writeStream.end());
    }
    if (streamToStop.writeStreamLatest && !streamToStop.writeStreamLatest.destroyed) {
        streamToStop.writeStreamLatest.write(cancellationMarker, 'utf8', () => streamToStop.writeStreamLatest.end());
    }
}

// FIFO queue to manage active, cancellable streams.
let activeStreamQueue = [];

async function streamLLMResponse(prompt, filePath) {
    const url = "http://llama:8111/completion";
    
    const payload = {
        prompt: prompt,
        n_predict: 512,
        repeat_penalty: 1.1,
        stream: true
    };

    console.log(`Starting LLM streaming to ${filePath}`);
    
    // Create a cancellation token source for this specific request.
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    let streamControl = null; // To hold all control objects for this stream.

    try {
        const completionMarker = "\n[STREAM_COMPLETE]\n";
        const styledPrompt = `[PROMPT]${prompt}[/PROMPT]`;
        
        fs.writeFileSync(filePath, styledPrompt);
        
        const response = await axios({
            method: 'post',
            url: url,
            data: payload,
            responseType: 'stream',
            cancelToken: source.token, // Pass the token to the request.
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return new Promise((resolve, reject) => {
            let buffer = '';
            let latestBufferLen = 0;
            
            const writeStream = fs.createWriteStream(filePath, { flags: 'a' });
            let writeStreamLatest = null;

            // --- Add this stream to the global queue ---
            streamControl = {
                cancelSource: source,
                filePath: filePath,
                writeStream: writeStream,
                writeStreamLatest: null // Will be assigned below
            };
            activeStreamQueue.push(streamControl);
            // ---

            let promiseSettled = false;
            const settle = (func, value) => {
                if (!promiseSettled) {
                    promiseSettled = true;
                    // Always remove from queue on completion or error.
                    activeStreamQueue = activeStreamQueue.filter(s => s !== streamControl);
                    func(value);
                }
            };
            
            response.data.on('data', (chunk) => {
                try {
                    buffer += chunk.toString();
                    if (latestBufferLen === 0) {
                        // This check seems to be for a LATEST_FILE global constant.
                        // Ensure LATEST_FILE is defined in your scope.
                        fs.writeFileSync(LATEST_FILE, styledPrompt);
                        writeStreamLatest = fs.createWriteStream(LATEST_FILE, { flags: 'a' });
                        streamControl.writeStreamLatest = writeStreamLatest; // Update control object.
                    }
                    latestBufferLen += chunk.length;
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); 
                    
                    for (const line of lines) {
                        if (!line.trim() || !line.startsWith('data: ')) continue;
                        
                        try {
                            const data = line.substring(6).trim();
                            if (data === '[DONE]') continue;
                            
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                writeStream.write(parsed.content, 'utf8');
                                if (writeStreamLatest) {
                                    writeStreamLatest.write(parsed.content, 'utf8');
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
                writeStream.write(completionMarker, 'utf8', () => writeStream.end());
                if (writeStreamLatest) {
                    writeStreamLatest.write(completionMarker, 'utf8', () => writeStreamLatest.end());
                }
                settle(resolve);
            });

            response.data.on('error', (err) => {
                console.error('Stream error:', err);
                if (!axios.isCancel(err)) { // Don't write marker if it was a user cancellation.
                    writeStream.write(completionMarker, 'utf8', () => writeStream.end());
                    if (writeStreamLatest) {
                        writeStreamLatest.write(completionMarker, 'utf8', () => writeStreamLatest.end());
                    }
                }
                settle(reject, err);
            });
            
            process.on('SIGINT', () => {
                writeStream.write(completionMarker, 'utf8', () => writeStream.end());
                if (writeStreamLatest) {
                    writeStreamLatest.write(completionMarker, 'utf8', () => writeStreamLatest.end());
                }
                process.exit();
            });
        });
    } catch (error) {
        // Remove from queue if an error happens before the stream starts.
        if (streamControl) {
            activeStreamQueue = activeStreamQueue.filter(s => s !== streamControl);
        }
        console.error('Error in streamLLMResponse:', error.message);
        
        // Don't mark as complete if it's a cancellation.
        if (!axios.isCancel(error)) {
            try {
                fs.appendFileSync(filePath, "\n[STREAM_ERROR]\n[STREAM_COMPLETE]\n", 'utf8');
            } catch (e) {
                console.error('Failed to write completion marker on initial error:', e);
            }
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
		"!stopsimo": stopSimo,
	}
}
