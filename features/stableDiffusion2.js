const axios = require('axios'),
    fs = require('fs'),
    moment = require('moment'),
    path = require('path'),
	apiHost = 'https://api.stability.ai';

const resultAddr = `http://gpt.prototyping.xyz`
const outputPath = `/simojs-data/html`

let token = JSON.parse(fs.readFileSync('simojs-data/settings.json')).stabilityAI.api_key

if (!token) throw new Error("Missing Stability API key.");

//const engineId = 'stable-diffusion-512-v2-1'
const engineId = 'stable-diffusion-xl-beta-v2-2-2'

const stabilityConf = {
	text_prompts: [
		{
			text: '',
		},
	],
	cfg_scale: 7,
	clip_guidance_preset: 'FAST_BLUE',
	height: 512,
	width: 512,
	samples: 1,
	steps: 50,
}
function stabilityai(client, channel, from, line) {
	const [numImages, width, height, ...promptParts] = line.split(' ').slice(1);

	const parsedWidth = parseInt(width, 10);
	const parsedHeight = parseInt(height, 10);
	const prompt = promptParts.join(' ');

	let conf = JSON.parse(JSON.stringify(stabilityConf));
	//let conf = Object.assign({}, stabilityConf)
	conf.text_prompts[0].text = prompt
	conf.height = parsedHeight
	conf.width = parsedWidth
	conf.samples = parseInt(numImages)

	stabilityRequest(conf, channel, client)
}


function advanced(client, channel, from, line) {
	const [numImages, width, height, cfg_scale, steps, clip_guidance_preset, ...promptParts] = line.split(' ').slice(1);

	const parsedWidth = parseInt(width, 10);
	const parsedHeight = parseInt(height, 10);
	const prompt = promptParts.join(' ');

	let conf = JSON.parse(JSON.stringify(stabilityConf));
	conf.cfg_scale = parseInt(cfg_scale)
	conf.clip_guidance_preset = clip_guidance_preset
	conf.steps = parseInt(steps)
	conf.text_prompts[0].text = prompt
	conf.height = parsedHeight
	conf.width = parsedWidth
	conf.samples = parseInt(numImages)

	stabilityRequest(conf, channel, client)
}

function stabilityRequest(conf, channel, client) {
	// Validate height and width
	if (
		conf.height % 64 !== 0 ||
		conf.width % 64 !== 0 ||
		conf.height * conf.width < 262144 ||
		conf.height * conf.width > 1048576
	) {
		client.say(
			channel,
			'Invalid dimensions. Height and width must be in increments of 64 and meet the following constraint: 262144 ≤ height * width ≤ 1048576'
		);
		return;
	}

	axios.post(
		`${apiHost}/v1beta/generation/${engineId}/text-to-image`,
		conf,
		{
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
			},
		}
	)
	.then(response => {
		if (response.status !== 200) {
			throw new Error(`Non-200 response: ${response.statusText}`);
		}

		const artifacts = response.data.artifacts;

		const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
		const promptStuff = conf.text_prompts[0].text.split(' ').slice(0, 3).join('-').replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '');
		const filePromptSuffix = promptStuff.substring(0, 10);
		const resultFile = `${timestamp}--${filePromptSuffix}`;

		artifacts.forEach((image, index) => {
			const img = `${resultFile}_${index}.png`;
			const filePath = `${outputPath}/${img}`;
			fs.writeFileSync(filePath, Buffer.from(image.base64, 'base64'));
		});

		const outputUrls = artifacts.map(
			(_, index) => `${resultAddr}/${resultFile}_${index}.png`
		);

		client.say(
			channel,
			`${outputUrls.join(' ')} ${promptStuff}`
		);


	})
	.catch(err => {
		console.error(err);
		client.say(channel, `Error: ${err.message}`);
	});
}


module.exports = {
	name: 'test', //not required atm iirc
	commands: {
		'!stablediffusion': stabilityai,
		'!stablediffusionpro': advanced,
	},
}
