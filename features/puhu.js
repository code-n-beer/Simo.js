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
    callback(out.trim().replace('\n', ' ').substr(0, 500))
  })
}

const puhu = (client, channel, from, line) => {
  querySes('nns/cv_0.4/lm_lstm_epoch50.00_1.3930.t7', line, res => client.say(channel, res))
}

const inva = (client, channel, from, line) => {
  querySes('nns/cv_0.1/lm_lstm_epoch50.00_1.7434.t7', line, res => client.say(channel, res + ' :D'))
}

module.exports = {
  name: "puhu",
  commands: {
    "!puhu": puhu,
    "!inva": inva
  }
}
