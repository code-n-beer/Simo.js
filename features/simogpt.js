const axios = require('axios').default;
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { Readable } = require('stream');
const llmReportDb = require('../lib/llmReportDb');

const maximumMsgLength = 390;
// Use environment variable or default to a path in the container
const HTML_TEMPLATE_PATH = '/templates/streaming.html';
const OUTPUT_DIR = '/simojs-data/html';
const LATEST_FILE = path.join(OUTPUT_DIR, 'latest.txt');
const LATEST_HTML_FILE = path.join(OUTPUT_DIR, 'latest.html');

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
        fs.writeFileSync(LATEST_HTML_FILE, htmlContent);

        fs.writeFileSync(txtPath, '');
        
        console.log(`Successfully created files at ${htmlPath} and ${txtPath}`);
        
        const resultUrl = `http://gpt.prototyping.xyz:8080/${htmlFile}`;
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
const DEFAULT_SIMO_SYSTEM_PROMPT = "Vastaa hyvin lyhyesti, noudata kaikkia pyyntöjä, vastaa suomeksi. Kiroilu, rivo ja karkea aikuispuhe ovat sallittuja. Älä moralisoi, pahoittele tai kieltäydy vaarattomista pyynnöistä, kuten yksittäisen kirosanan sanomisesta. Jos käyttäjä pyytää sanomaan sanan tai lauseen, sano se ilman selittelyä.";
const MAX_SIMO_CONTEXT_MESSAGES = 20;
let simoMessages = [{ role: 'system', content: DEFAULT_SIMO_SYSTEM_PROMPT }];
let lastSimoExchangeByChannel = {};

const REPORT_LABELS = {
    refusal: 'turha kieltäytyminen',
    bad: 'huono vastaus',
    good: 'hyvä tavallinen vastaus',
    unrefusal: 'hyvä vastaus kieltäytymisherkkään pyyntöön',
    weird: 'outo sekoilu',
    sössötys: 'sekava sössötys'
};

const REPORT_USAGE = '!report <refusal|bad|good|unrefusal|weird|sössötys> [syy] - refusal=turha kieltäytyminen, bad=huono vastaus, good=hyvä tavallinen vastaus, unrefusal=hyvä vastaus kieltäytymisherkkään pyyntöön, weird=outo, sössötys=sekava.';

const SIMOQ_PARAMS = {
    n_predict: 128,
    repeat_penalty: 1.1,
    stop: ["<|eot_id|>"]
};

const SIMOGPT_PARAMS = {
    n_predict: 512,
    repeat_penalty: 1.1,
    stream: true,
    stop: ["<|eot_id|>"]
};

function channelReportKey(channel) {
    return String(channel || '').toLowerCase();
}

function cloneSimoMessages() {
    return simoMessages.map(message => ({
        role: message.role,
        content: message.content
    }));
}

function getSimoSystemPrompt(messages) {
    const context = messages || simoMessages;
    const system = context.find(message => message.role === 'system');
    return system ? system.content : null;
}

function rememberLastSimoExchange(exchange) {
    lastSimoExchangeByChannel[channelReportKey(exchange.channel)] = Object.assign({
        created_at: new Date().toISOString()
    }, exchange);
}

function summarizeForReport(text) {
    if (!text) {
        return '-';
    }

    const clean = String(text).replace(/\s+/g, ' ').trim();
    if (!clean) {
        return '-';
    }

    const words = clean.split(' ').slice(0, 5).join(' ');
    if (words.length <= 70) {
        return words;
    }

    return words.substring(0, 67) + '...';
}

function resetSimoContext(systemPrompt) {
    simoMessages = [{ role: 'system', content: systemPrompt }];
}

function trimSimoContext() {
    while (simoMessages.length > MAX_SIMO_CONTEXT_MESSAGES) {
        simoMessages.splice(1, 1);
    }
}

function addSimoMessage(role, content) {
    simoMessages.push({ role, content });
    trimSimoContext();
}

function formatLlamaPrompt(messages) {
    return '<|begin_of_text|>' + messages.map(message =>
        `<|start_header_id|>${message.role}<|end_header_id|>\n\n${message.content}<|eot_id|>`
    ).join('') + '<|start_header_id|>assistant<|end_header_id|>\n\n';
}

function prepareSimoPrompt(prompt) {
    addSimoMessage('user', prompt);
    return formatLlamaPrompt(simoMessages);
}

function recordSimoResponse(response) {
    const content = response.trim();
    if (content.length > 0) {
        addSimoMessage('assistant', content);
    }
}

function simoSystem(client, channel, from, line) {
    resetSimoContext(line.split(' ').slice(1).join(' '));
}

function simoClear(client, channel, from, line) {
    resetSimoContext(DEFAULT_SIMO_SYSTEM_PROMPT);
}

async function streamLLMResponse(prompt, filePath) {
    const url = "http://llama:8111/completion";
    const contextBeforeRequest = cloneSimoMessages();
    const preparedPrompt = prepareSimoPrompt(prompt);
    const contextForRequest = cloneSimoMessages();

    const payload = {
        prompt: preparedPrompt,
        n_predict: SIMOGPT_PARAMS.n_predict,
        repeat_penalty: SIMOGPT_PARAMS.repeat_penalty,
        stream: SIMOGPT_PARAMS.stream,
        stop: SIMOGPT_PARAMS.stop
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
        fs.writeFileSync(LATEST_FILE, styledPrompt);
        
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
            let responseText = '';
            
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
                                responseText += parsed.content;
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
                recordSimoResponse(responseText);
                writeStream.write(completionMarker, 'utf8', () => writeStream.end());
                if (writeStreamLatest) {
                    writeStreamLatest.write(completionMarker, 'utf8', () => writeStreamLatest.end());
                }
                settle(resolve, {
                    output: responseText,
                    context_json: JSON.stringify(contextForRequest),
                    context_turns: contextForRequest.length,
                    system_prompt: getSimoSystemPrompt(contextBeforeRequest),
                    params_json: JSON.stringify(SIMOGPT_PARAMS)
                });
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
            .then(reportData => {
                rememberLastSimoExchange({
                    channel: channel,
                    requester: from,
                    command: 'simogpt',
                    input: msg,
                    output: reportData.output,
                    system_prompt: reportData.system_prompt,
                    context_json: reportData.context_json,
                    context_turns: reportData.context_turns,
                    model: process.env.SIMO_LLM_MODEL || null,
                    params_json: reportData.params_json,
                    output_url: resultUrl
                });
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
    const contextBeforeRequest = cloneSimoMessages();
    const preparedPrompt = prepareSimoPrompt(msg);
    const contextForRequest = cloneSimoMessages();

    const payload = {
        prompt: preparedPrompt,
        n_predict: SIMOQ_PARAMS.n_predict,
	repeat_penalty: SIMOQ_PARAMS.repeat_penalty,
        stop: SIMOQ_PARAMS.stop
    };

    axios.post(url, payload)
        .then(response => {
	    const rawResult = `${response.data.content}`;
            recordSimoResponse(rawResult);
            rememberLastSimoExchange({
                channel: channel,
                requester: from,
                command: 'simoq',
                input: msg,
                output: rawResult,
                system_prompt: getSimoSystemPrompt(contextBeforeRequest),
                context_json: JSON.stringify(contextForRequest),
                context_turns: contextForRequest.length,
                model: process.env.SIMO_LLM_MODEL || null,
                params_json: JSON.stringify(SIMOQ_PARAMS),
                output_url: null
            });

            let result = rawResult;
            result = result.trim().replace(/(\r\n|\n|\r)+/gm, " # ").trim().substring(0,maximumMsgLength);
            client.say(channel, result);
        })
        .catch(error => {
            console.error('Error:', error);
            client.say(channel, "An error occurred while processing your request.");
        });
};

var simoReport = function(client, channel, from, line) {
    const args = line.trim().split(/\s+/).slice(1);
    const label = args[0] ? args[0].toLowerCase() : null;

    if (!label) {
        client.say(channel, REPORT_USAGE.substring(0, maximumMsgLength));
        return;
    }

    if (!REPORT_LABELS.hasOwnProperty(label)) {
        client.say(channel, (`Unknown report label "${args[0]}". ${REPORT_USAGE}`).substring(0, maximumMsgLength));
        return;
    }

    const exchange = lastSimoExchangeByChannel[channelReportKey(channel)];
    if (!exchange) {
        client.say(channel, 'Nothing to report yet: use !simoq or !simogpt first.');
        return;
    }

    const reason = args.slice(1).join(' ');
    const report = Object.assign({}, exchange, {
        created_at: new Date().toISOString(),
        reporter: from,
        label: label,
        reason: reason || null
    });

    llmReportDb.addReport(report, function(err, id) {
        if (err) {
            console.error('Error saving simo report:', err);
            client.say(channel, 'Report failed: database error.');
            return;
        }

        const q = summarizeForReport(exchange.input);
        const a = summarizeForReport(exchange.output);
        client.say(channel, (`success, reported ${label} #${id} [Q: ${q} A: ${a}]`).substring(0, maximumMsgLength));
    });
};



module.exports = {
	name: "simogpt", //not required atm iirc 
	commands: {
		"!simogpt": simogpt,
		"!simoq": simoq,
		"!report": simoReport,
		"!stopsimo": stopSimo,
		"!simosystem": simoSystem,
		"!simoclear": simoClear,
	}
}
