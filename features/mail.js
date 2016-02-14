var async = require('async');
var express = require('express');
var fs = require('fs');
var multiparty = require('multiparty');
var util = require('util');


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
        mails.push(parseMail(JSON.parse(fields.mailinMsg)));
        }
        catch(err) {
            console.log('mail receive failed');
        }
    });
});

function parseMail(mail) {
    var obj = {};
    obj.text = mail.text;
    obj.from = mail.from;
    obj.to = mail.to;
    obj.subject = mail.subject;
    console.log(obj);
    return obj;
}

var getMail = function(client, channel, from, line) {
    if(mails.length > 0) {
        var mail = mails.pop();
        var msg = "<From: " + mail.from[0].address + " To: " + mail.to[0].address + "> " + mail.subject + " // " + mail.text;
        return client.say(channel, msg);
    }
    client.say(channel, 'No new mail');
}

var init = function(config, client) {
    server.listen(54321, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Http server listening on port 54321');
        }
    });
}

module.exports = {
    name: "mail", //not required atm iirc 
    commands: { 
        "!mail": getMail,
    },
    init: init
}
