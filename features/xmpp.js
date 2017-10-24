var XMPPClient = require('node-xmpp-client');
var client;
var init = function(config, client) {
    xmppclient = new XMPPClient({
        jid: config.wpuser + '@im.wordpress.com',
        password: config.wppass
    });
    xmppclient.on('online', function() {
        //console.log('online')
        xmppclient.send(new XMPPClient.Stanza('presence', {})
            .c('show').t('chat').up()
            .c('status').t('Happily echoing your <message/> stanzas')
        )
    });
    xmppclient.on('stanza', function(stanza) {
        if (stanza.is('message') && (stanza.attrs.type !== 'error')) {
            //console.log('new message');
            var msgArray = stanza.children[0].children[0].split('\n');
            var headline = msgArray[0];
            var url = msgArray[msgArray.length - 1];
            var message = headline + " -> " + url;
            client.say(config.channel, message);
        } else {
            //console.log(stanza);
        }
    });
    xmppclient.on('error', function(msg) {
        console.log('error: ' + msg);
        console.log(msg);
    })
}

var count = 0;
var hello = function(client, channel, from, line) {
    count++;
    var ret = "Feature has been ran " + count + " times. !post not implemented yet";
    client.say(channel, ret);
}

module.exports = {
    name: "xmpp", //not required atm iirc 
    commands: {
        "!post": hello,
    },
    init: init
}