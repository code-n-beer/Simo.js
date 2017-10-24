const spawn = require('child_process').spawn

const hello = function(client, channel, from, line) {
    //const proc = spawn('ls', ['./simojs-data/ssh/'])
    //const proc = spawn('ssh', ['-o StrictHostKeyChecking=no', '-i ./simojs-data/ssh/id_rsa_nopasswd', 'simobot@192.168.8.113', 'cd ~/simo-vps && ~/simo-vps/virtual_private_simo/reboot_virtualsimo'])
    const proc = spawn('ssh', `-o StrictHostKeyChecking=no -i ./simojs-data/ssh/id_rsa_nopasswd simobot@192.168.8.113`.split(' ').concat('cd ~/simo-vps && ~/simo-vps/virtual_private_simo/reboot_virtualsimo'))
    //const proc = spawn('ssh', `-o StrictHostKeyChecking=no -i ./simojs-data/ssh/id_rsa_nopasswd sudoer@${process.env.DOCKER_HOST}`.split(' ').concat([paramStr[rnnVersion]]))
    let result = ''
    proc.stdout.on('data', (data) => data.indexOf('Creating simovps_virtualsimo_1') >= 0 ? client.say(channel, data) : null)
    proc.stdout.on('data', (data) => data.indexOf('Building virtualsimo') >= 0 ? client.say(channel, data) : null)
    proc.stdout.on('data', (data) => data.indexOf('Virtual simo') >= 0 ? client.say(channel, data) : null)
    proc.stdout.on('data', (data) => data.indexOf('simovps_virtualsimo_1 exited with code') >= 0 ? client.say(channel, data) : null)
    proc.stderr.on('data', (data) => result += data)
    proc.on('close', (code) => {
        console.log(result.replace('\n', ' | '))
    })
}

module.exports = {
    name: 'vps rebooter',
    commands: {
        '!rebootvps': hello,
    }
}