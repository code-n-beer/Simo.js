const translate = require('./translate.js').commands["!tr"];
const http = require('http');
const concat = require('../lib/concat.js');

//translate.commands["!tr"](client, channel, from, 

var init = function(config) {}

var options = {
    host: 'thermopylas.fi',
    port: 80,
    path: '/ws/nicksit.php'
}

var protip = function(client, channel, from, line) {

    http.get(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            translate(client, channel, from, "!tr en " + concat(chunk, line));
        });
    }).on('error', function(e) {
        console.log("error: " + e.message);
    });
}

var hurri = function(client, channel, from, line) {
    http.get(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            translate(client, channel, from, "!tr sv " + concat(chunk, line));
        });
    }).on('error', function(e) {
        console.log("error: " + e.message);
    });

}
var koksi = function(client, channel, from, line) {
    var say = function(client, channel, from, translate) {
        return function(channel, korean) {
            translate(client, channel, from, "tr " + korean);
        }
    }
    var sej = say(client, channel, from, translate);
    var clinu = {
        say: sej
    };
    http.get(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            translate(clinu, channel, from, "!tr ko " + concat(chunk, line));
        });
    }).on('error', function(e) {
        console.log("error: " + e.message);
    });
}

var niksi = function(client, channel, from, line) {
    http.get(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            client.say(channel, concat(chunk, line))
        });
    }).on('error', function(e) {
        console.log("error: " + e.message);
    });
}
module.exports = {
    name: "protip",
    commands: {
        "!protip": protip,
        "!niksen": hurri,
        "!koksi": koksi,
        "!niksi": niksi
    }
}