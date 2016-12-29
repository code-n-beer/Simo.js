const spawn = require('child_process').spawn

const puhu = (client,channel,from,line) => {
  let lineArr = line.split(' ')
  lineArr.shift()
  let primetext = ''
  let temperature = Math.min(Math.random() / 2 + 0.5, 1)
  if(isNaN(parseFloat(lineArr[0]))) {
    primetext = lineArr.join(' ')
  } else {
    temperature = Math.max(Math.min(parseFloat(lineArr[0]), 1), 0.001)
    lineArr.shift()
    primetext = lineArr.join(' ')
  }
  temperature = temperature.toString().substring(0, 5)
  primetext = !primetext.match('/\'/') ? primetext : ''

  const seed = Math.floor(Math.random()*100000)
  const length = 500
  const paramStr = `cd torch/char-rnn && /home/sudoer/torch/install/bin/th sample.lua nns/cv_0.4/lm_lstm_epoch50.00_1.3930.t7 -verbose 0 -length ${length} -seed ${seed} -temperature ${temperature} -primetext '${primetext}'`

  console.log('running', paramStr)
  const proc = spawn('ssh', '-i ~/.ssh/id_rsa_nopasswd -p 2200 sudoer@localhost'.split(' ').concat([paramStr]))
  let result = ''
  proc.stdout.on('data', (data) => result += data)
  proc.stderr.on('data', (data) => console.log(`stderr: ${data}`))
  proc.on('close', (code) => {
    console.log(`sentient simo closed with code ${code}:\n${result}`)
    const lines = result.split('\n')
    const index = primetext ? 0 : Math.floor(Math.random() * lines.length)
    client.say(channel, lines[index].trim())
  })
}

module.exports = {
  name: "puhu",
  commands: {
    "!puhu": puhu
  }
}
