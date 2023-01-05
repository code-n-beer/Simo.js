const axios = require('axios'),
    fs = require('fs'),
    moment = require('moment'),
    path = require('path');

let token = JSON.parse(fs.readFileSync('simojs-data/settings.json')).stablediffusion.api_key
let dalleToken = JSON.parse(fs.readFileSync('simojs-data/settings.json')).dalle.api_key

let authHeader = {
	Authorization: `Token ${token}`,
	'Content-Type':'application/json'
}
let defaultHeaders = {
	headers: authHeader
}

const resultAddr = `http://gpt.prototyping.xyz`
const outputPath = `/simojs-data/html`

function loopUntilReady(getUrl, say) {
	let started = false;
	let processing = false;
	return new Promise(function cb(resolve, reject) {
		axios.get(getUrl, defaultHeaders).then(r => {
			let status = r.data.status
			console.log('status ', status)
			switch (status) {
				case 'succeeded':
					resolve(r.data.output);
					break;
				case 'failed':
					console.log('huoh')
					say('failed')
					reject('failed')
					break;
				case 'starting':
					if (!started) {
						//say('starting')
						console.log('starting')
						started = true;
					}
					setTimeout(() => cb(resolve, reject), 500)
					break;
				case 'processing':
					if (!processing) {
						//say('processing')
						console.log('processing')
						processing = true;
					}
					setTimeout(() => cb(resolve, reject), 500)
					break;
				default:
					console.log('default juuh', status)
					setTimeout(() => cb(resolve, reject), 500)

			}
		})
	})
}

let defaultConfigs = {
	width: 512,
	height: 512,
	'prompt_strength': 0.8,
	'guidance_scale': 7.5,
	'num_inference_steps': 30,
	'num_outputs': 4,
	scheduler: 'K_EULER',
}

function validateConf(conf) {
	conf['num_inference_steps'] = Math.min(300, conf['num_inference_steps'])
	conf['num_outputs'] = Math.min(4, conf['num_outputs'])
}

function generate(client, channel, from, line) {
	const input = line.split(' ').slice(1).join(' ');

	let [num, steps, ...prompt] = input.split(' '); 
	prompt = prompt.join(' ')
	console.log('prompt', prompt)

	let conf = Object.assign({}, defaultConfigs)
	conf['num_inference_steps'] = steps
	conf['num_outputs'] = num
	conf.prompt = prompt

	validateConf(conf)

	console.log('conf', conf)

	const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
	const promptStuff = prompt.split(' ')[0].replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '')
	const filePromptSuffix = promptStuff.substring(0,10)
	const resultFile = `${timestamp}--${filePromptSuffix}`

	let results = Array.from(Array(conf['num_outputs']).keys()).map(i => `${resultFile}_${i}.png`)
	console.log('results', results)
	let urls = results.map(img => `${resultAddr}/${img}`).join(' ')
	console.log('urls', urls)
	let msg = `(after ready): ${urls} ${prompt}`
	console.log('sending to client: ', msg)
	client.say(channel, msg)

	axios.post('https://api.replicate.com/v1/predictions', {
		version: 'f178fa7a1ae43a9a9af01b833b9d2ecf97b1bcb0acfd2dc5dd04895e042863f1', 
		input: conf}, defaultHeaders).then(r=> loopUntilReady(r.data.urls.get, msg=>client.say(channel, msg))
		).then(rr => Promise.all(rr.map((url, index) =>
			axios.get(url, {headers: authHeader, responseType: 'stream'}).then(response => {
				console.log('fetching url', url, 'index', index)
				const img = `${resultFile}_${index}.png`
				const filePath = `${outputPath}/${img}`
				const writer = fs.createWriteStream(filePath)
				response.data.pipe(writer)
				return new Promise((resolve, reject) => {
					writer.on('finish', resolve(img))
					writer.on('error', reject)
				})
			})
		))).then(results => {
			console.log('finished')
		}).catch(e=>console.log(e) || client.say(channel, 'caught err', e))
}

let dalleConfig = {
	'size': '512x512',
	'n': 4,
}

let dalleAuth = {
	Authorization: `Bearer ${dalleToken}`,
	'Content-Type':'application/json'
}
let dalleHeaders = {
	headers: dalleAuth
}

function parseDalleConf(line) {
	const input = line.split(' ').slice(1).join(' ');

	let [num, size, ...prompt] = input.split(' '); 
	prompt = prompt.join(' ')
	console.log('prompt', prompt)

	console.log('using dalle auth', dalleAuth)

	let conf = Object.assign({}, dalleConfig)
	conf['n'] = Math.min(4, num)
	conf.prompt = prompt

	size = Math.min(1024, size)
	conf.size = `${size}x${size}`
	return conf
}

function downloadImages(urls, resultFile) {
	return Promise.all(urls.map((url, index) =>
		axios.get(url, {responseType: 'stream'}).then(response => {
			console.log('fetching url', url, 'index', index)
			const img = `${resultFile}_${index}.png`
			const filePath = `${outputPath}/${img}`
			const writer = fs.createWriteStream(filePath)
			response.data.pipe(writer)
			return new Promise((resolve, reject) => {
				writer.on('finish', resolve(img))
				writer.on('error', reject)
			})
		})
	))
}

function sayResults(prompt, results, say) {
	//let results = Array.from(Array(conf['n']).keys()).map(i => `${resultFile}_${i}.png`)
	console.log('results', results)
	let urls = results.map(img => `${resultAddr}/${img}`).join(' ')
	console.log('urls', urls)
	let msg = `${urls} ${prompt}`.substring(0, 300)
	console.log('sending to client: ', msg)
	say(msg)
	console.log('finished')
}

function dalle(client, channel, from, line) {
	const conf = parseDalleConf(line)

	console.log('conf', conf)

	const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
	const promptStuff = prompt.split(' ')[0].replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '')
	const filePromptSuffix = promptStuff.substring(0,10)
	const resultFile = `${timestamp}--${filePromptSuffix}`

	axios.post('https://api.openai.com/v1/images/generations', conf, dalleHeaders)
		.then(rr => downloadImages(rr.data.data.map(o => o.url), resultFile))
		.then(results => sayResults(conf.prompt, results, msg => client.say(channel, msg)))
		.catch(e=>console.log(e) || client.say(channel, `caught err: ${e}`))
}


const jimp = require('jimp');
const FormData = require('form-data');
function cropAndConvert(img, say) {
	const fileName = moment().format('YYYY-MM-DD_HH-mm-ss')
	const filePath = `/simojs-data/img-convert/${fileName}.png`
	return jimp.read(img).then(image => {
		let width = image.bitmap.width;
		let height = image.bitmap.height;
		let croppWidth = width > height ? height : width;
		let startX = (width / 2) - (croppWidth / 2);
		let startY = (height /2) - (croppWidth / 2);

		return image.crop(startX,startY, croppWidth,croppWidth)
		.quality(100) // set JPEG quality
		.writeAsync(filePath) // save
		.then(f => filePath)
	}).catch(err => {
		console.error(err);
		say('jimp error', err);
	});
}

const variationUrl = `https://api.openai.com/v1/images/variations`
function variations(client, channel, from, line) {
	const conf = parseDalleConf(line)

	const url = conf.prompt
	delete conf.prompt

	const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
	const promptStuff = url.split('/').slice(-1)[0].replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '')
	const filePromptSuffix = promptStuff.substring(0,10)
	const resultFile = `${timestamp}--${filePromptSuffix}`

	axios.get(url, {responseType: 'arraybuffer'}).then(response =>
		cropAndConvert(response.data, msg => client.say(channel, msg))
	).then(filePath => {
		const form = new FormData();
		form.append('image', fs.readFileSync(filePath), 'someimg.png');

		Object.keys(conf).forEach((key, index) => {
			let val = conf[key];
			form.append(key, val)
		});
		
		const config = {
		  headers: {
			  Authorization: `Bearer ${dalleToken}`,
			  ...form.getHeaders(),
		  },
		}

		return axios.post(variationUrl, form, config)
	})
	.then(rr => downloadImages(rr.data.data.map(o => o.url), resultFile))
	.then(results => sayResults(`variations of ${url}`, results, msg => client.say(channel, msg)))
	.catch(e=>console.log(e) || client.say(channel, `caught err: ${e}`))
};

module.exports = {
    name: 'test', //not required atm iirc
    commands: {
        '!stablediffusion': generate,
        '!dalle': dalle,
	'!variation': variations,
    },
}
