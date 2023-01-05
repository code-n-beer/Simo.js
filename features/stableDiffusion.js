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
	const filePath = `/simojs-data/html/${resultFile}`
	const resultAddr = `http://gpt.prototyping.xyz`

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
				const filePath = `/simojs-data/html/${img}`
				const writer = fs.createWriteStream(filePath)
				response.data.pipe(writer)
				return new Promise((resolve, reject) => {
					writer.on('finish', resolve(img))
					writer.on('error', reject)
				})
			})
		))).then(results => {
			//console.log('got results', results)
			//let urls = results.map(img => `${resultAddr}/${img}`).join(' ')
			//let msg = `${urls} ${prompt}`.substring(0, 300)
			//console.log('sending to client: ', msg)
			//client.say(channel, `Finished: ${prompt.substring(0,250)}`)
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

function dalle(client, channel, from, line) {
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

	console.log('conf', conf)

	const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss')
	const promptStuff = prompt.split(' ')[0].replace(/[^a-zA-Z0-9öäåÖÄÅ\-]+/g, '')
	const filePromptSuffix = promptStuff.substring(0,10)
	const resultFile = `${timestamp}--${filePromptSuffix}`
	const filePath = `/simojs-data/html/${resultFile}`
	const resultAddr = `http://gpt.prototyping.xyz`


	axios.post('https://api.openai.com/v1/images/generations', conf, dalleHeaders
	).then(rr => Promise.all(rr.data.data.map((obj, index) =>
		axios.get(obj.url, {responseType: 'stream'}).then(response => {
			console.log('fetching url', obj.url, 'index', index)
			const img = `${resultFile}_${index}.png`
			const filePath = `/simojs-data/html/${img}`
			const writer = fs.createWriteStream(filePath)
			response.data.pipe(writer)
			return new Promise((resolve, reject) => {
				writer.on('finish', resolve(img))
				writer.on('error', reject)
			})
		})
		))).then(results => {
			//let results = Array.from(Array(conf['n']).keys()).map(i => `${resultFile}_${i}.png`)
			console.log('results', results)
			let urls = results.map(img => `${resultAddr}/${img}`).join(' ')
			console.log('urls', urls)
			let msg = `${urls} ${prompt}`.substring(0, 300)
			console.log('sending to client: ', msg)
			client.say(channel, msg)

			//console.log('got results', results)
			//let urls = results.map(img => `${resultAddr}/${img}`).join(' ')
			//let msg = `${urls} ${prompt}`.substring(0, 300)
			//console.log('sending to client: ', msg)
			//client.say(channel, `Finished: ${prompt.substring(0,250)}`)
			console.log('finished')
		}).catch(e=>console.log(e) || client.say(channel, 'caught err', e))
}


//TODO: need to crop the image to square size first before openai API will accept it
// function variations(client, channel, from, line) {
// 	const input = line.split(' ').slice(1).join(' ');
// 	let [num, size, ...prompt] = input.split(' '); 
// 
// 		axios.get(obj.url, {responseType: 'stream'}).then(response => {
// 	const form = new FormData();
// 	form.append('file', fs.readFileSync(filePath), fileName);
// 
// 	const config = {
// 	  headers: {
// 	    Authorization: `Bearer ${auth.access_token}`,
// 	    ...form.getHeaders(),
// 	  },
// };

axios.post(api, form.getBuffer(), config);
}

module.exports = {
    name: 'test', //not required atm iirc
    commands: {
        //'!stablediffusion': generate,
        '!dalle': dalle,
    },
}
