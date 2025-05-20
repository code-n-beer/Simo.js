const axios = require('axios'),
    fs = require('fs'),
    moment = require('moment'),
    path = require('path'),
    FormData = require('form-data'),
    apiHost = 'https://api.stability.ai';

const resultAddr = `https://gpt.prototyping.xyz`
const outputPath = `/simojs-data/html`

let token = JSON.parse(fs.readFileSync('/simojs-data/settings.json')).stabilityAI.api_key

if (!token) throw new Error("Missing Stability API key.");

const stabilityConf = {
    prompt: '',
    aspect_ratio: '1:1',
    output_format: 'jpeg'
};

function stabilityai(client, channel, from, line) {
    const [aspectRatio, ...promptParts] = line.split(' ').slice(1);

    const prompt = promptParts.join(' ');

    let conf = JSON.parse(JSON.stringify(stabilityConf));
    conf.prompt = prompt;
    conf.aspect_ratio = aspectRatio;

    stabilityRequest(conf, channel, client);
}

function stabilityRequest(conf, channel, client) {
    const form = new FormData();
    form.append('prompt', conf.prompt);
    form.append('aspect_ratio', conf.aspect_ratio);
    form.append('output_format', conf.output_format);

    axios.post(
        `${apiHost}/v2beta/stable-image/generate/sd3`,
        form,
        {
            headers: {
                ...form.getHeaders(),
                'Accept': 'image/*',
                'Authorization': `Bearer ${token}`,
            },
            responseType: 'arraybuffer'
        }
    )
    .then(response => {
        if (response.status !== 200) {
            throw new Error(`Non-200 response: ${response.statusText}`);
        }

        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const promptStuff = conf.prompt.split(' ').slice(0, 3).join('-').replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '');
        const filePromptSuffix = promptStuff.substring(0, 10);
        const resultFile = `${timestamp}--${filePromptSuffix}.${conf.output_format}`;
        const filePath = `${outputPath}/${resultFile}`;
        
        fs.writeFileSync(filePath, Buffer.from(response.data, 'binary'));

        client.say(channel, `${resultAddr}/${resultFile} ${promptStuff}`);
    })
    .catch(err => {
        console.error(err);
        client.say(channel, `Error: ${err.message}`);
    });
}


module.exports = {
    name: 'test',
    commands: {
        '!stablediffusion': stabilityai,
    },
}

