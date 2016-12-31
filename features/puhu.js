const spawn = require('child_process').spawn

const querySes = (sesPath, line, callback) => {
  let lineArr = line.split(' ')
  lineArr.shift()

  let primetext = ''
  let targetLength = null
  let temperature = Math.min(Math.random() / 2 + 0.5, 1)

  if(isNaN(parseFloat(lineArr[0]))) {
    primetext = lineArr.join(' ')
  } else {
    if(lineArr[0] > 1) {
      targetLength = Math.floor(parseFloat(lineArr[0]))
    } else {
      temperature = Math.max(Math.min(parseFloat(lineArr[0]), 1), 0.001)
      lineArr.shift()
      if(isNaN(parseInt(lineArr[0]))) {
        primetext = lineArr.join(' ')
      } else {
        targetLength = Math.floor(parseFloat(lineArr[0]))
        lineArr.shift()
        primetext = lineArr.join(' ')
      }
    }
  }
  console.log('target length', targetLength)
  temperature = temperature.toString().substring(0, 5)
  primetext = !primetext.match('/\'/') ? primetext : ''

  const seed = Math.floor(Math.random()*100000)
  const length = 500
  const paramStr = `cd torch/char-rnn && /home/sudoer/torch/install/bin/th sample.lua ${sesPath} -verbose 0 -length ${length} -seed ${seed} -temperature ${temperature} -primetext '${primetext}'`

  console.log('running', paramStr)
  const proc = spawn('ssh', '-i ~/.ssh/id_rsa_nopasswd -p 2200 sudoer@localhost'.split(' ').concat([paramStr]))
  let result = ''
  proc.stdout.on('data', (data) => result += data)
  proc.stderr.on('data', (data) => console.log(`stderr: ${data}`))
  proc.on('close', (code) => {
    console.log(`sentient simo closed with code ${code}:\n${result}`)
    const lines = result.split('\n').filter(line => line.trim().length > 1)
    const out = targetLength
      ? lines.map(line => { return {line, dist: Math.abs(line.length - targetLength)}}).reduce((cur, best) => cur.dist < best.dist ? cur : best, {line:'', dist: Number.MAX_SAFE_INTEGER}).line
      : lines[primetext ? 0 : Math.floor(Math.random() * lines.length)]
    callback(out.trim().replace('\n', ' ').substr(0, 500), lines)
  })
}

const puhu = (client, channel, from, line) => {
  querySes('nns/cv_0.4/lm_lstm_epoch50.00_1.3930.t7', line, (res, lines) => {
  })
}

const inva = (client, channel, from, line) => {
  querySes('nns/cv_0.1/lm_lstm_epoch50.00_1.7434.t7', line, res => client.say(channel, res + ' :D'))
}

let ketaNick = 'nobody what the ass?'
const keta = (client, channel, from, line) =>
  line.split(' ').length > 1 ? arvaaKeta(client, channel, from, line) : puhuKeta(client, channel, from, line)


const puhuKeta = (client, channel, from, line) => {
  querySes('nns/cv_0.5/lm_lstm_epoch32.03_1.2095.t7', line, (res, lines) => {
    const sensibleLines = lines.filter(l => ~l.indexOf('\t') && !~l.indexOf('--'))
    if(!sensibleLines) {
      client.say(channel, 'Is not of workings. Try again perhaps?')
      return
    }
    const lineArr = sensibleLines.map(l => l.split('\t'))[Math.floor(Math.random() * sensibleLines.length)]
    ketaNick = lineArr[0].trim()
    client.say(channel, lineArr[1])
   })
}

const arvaaKeta = (client, channel, from, line) => {
  const random = Math.random()
  const floored = Math.floor(random*10)
  let result = ''
  let answerStr = line.split(' ')[1].toLowerCase() === ketaNick ? 'correct' : 'wrong'
  if(random < 0.5) {
    answerStr = (random < 0.2) ? answerStr.toUpperCase() : answerStr
    result = answerStr + '.'.repeat(floored % 3 + 1)
  } else if(random < 0.7) {
    result = 'Your answer was of the following kind: ' + answerStr + '!'.repeat(floored % 4)
  } else {
    result = 'Good guess! That was ' + answerStr + '.'.repeat(floored % 3 + 1)
  }
  result += ' The correct answer was... ' + ketaNick + '!'.repeat(floored % 3) + '?'.repeat(floored % 1)
  ketaNick = 'nobody what the ass'
  client.say(channel, result)
}


module.exports = {
  name: "puhu",
  commands: {
    "!puhu": puhu,
    "!inva": inva,
    "!ketä":keta,
    "!keta": keta
  }
}
