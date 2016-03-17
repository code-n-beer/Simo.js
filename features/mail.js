var escape = require('escape-html');
var async = require('async');
var express = require('express');
var fs = require('fs');
var multiparty = require('multiparty');
var util = require('util');
var path = require('path');


var mails = [];


/* Make an http server to receive the webhook. */
var server = express();

server.head('/webhook', function (req, res) {
    console.log('Received head request from webhook.');
    res.send(200);
});

server.post('/webhook', function (req, res) {
    console.log('Receiving webhook.');

    /* Respond early to avoid timouting the mailin server. */
    // res.send(200);

    /* Parse the multipart form. The attachments are parsed into fields and can
     * be huge, so set the maxFieldsSize accordingly. */
    var form = new multiparty.Form({
        maxFieldsSize: 70000000
    });

    form.on('progress', function () {
        var start = Date.now();
        var lastDisplayedPercentage = -1;
        return function (bytesReceived, bytesExpected) {
            var elapsed = Date.now() - start;
            var percentage = Math.floor(bytesReceived / bytesExpected * 100);
            if (percentage % 20 === 0 && percentage !== lastDisplayedPercentage) {
                lastDisplayedPercentage = percentage;
                console.log('Form upload progress ' +
                    percentage + '% of ' + bytesExpected / 1000000 + 'Mb. ' + elapsed + 'ms');
            }
        };
    }());

    form.parse(req, function (err, fields) {
        try {
            handleMail(JSON.parse(fields.mailinMsg));
        }
        catch(err) {
            console.log(err);
            console.log('mail receive failed');
        }
    });
});

var filepath;
var client;
var channel;
var url;
var spammers = [
    'z2007tw@yahoo.com.tw',
]; 

var receivers = [
];

function handleMail(mail) {
    var obj = {};
    obj.text = escape(mail.text);
    obj.from = escape(mail.from[0].address);

    if(spammers.indexOf(mail.from[0].address.trim()) >= 0){
        return;
    }
    obj.to = escape(mail.to[0].address);

    if(obj.to.toLowerCase().indexOf('hypsy.fi') < 0 && obj.to.toLowerCase().indexOf('arkikuos.it') < 0) {
        return;
    }

    obj.subject = escape(mail.subject);
    console.log(obj);
    var filename = makeid() + '.html';
    var fullPath = path.join(filepath, filename);
    var text = util.format(
        '<html> <head> </head> <body> <h1> %s </h1> <p> From <b> %s </b> To <b> %s </b> </p> <p> %s </p></body> </html>',
        obj.subject, obj.from, obj.to, obj.text
    );
    fs.writeFileSync(fullPath, text);
    var msg = util.format("<From: %s To: %s> %s || %s", obj.from, obj.to, obj.subject, url + filename);
    client.say(channel, msg);
}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var init = function(config, cli) {
    url = config.mailFileUrl;
    filepath = config.mailFilePath;
    channel = config.channel;
    client = cli;
    console.log(url, channel, path);
    server.listen(54321, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Http server listening on port 54321');
        }
    });
}
function getMail() {
}

module.exports = {
    name: "mail", //not required atm iirc 
    commands: { 
        "!mail": getMail,
    },
    init: init
}
