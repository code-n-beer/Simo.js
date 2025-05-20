const concat = require('../lib/concat.js');
const request = require('request');
const htmlparser = require('htmlparser2');
const iconvlite = require('iconv-lite');

var begincapt = false;
var puppulause = "";

function new_parser(say) {
    return new htmlparser.Parser({
        onopentag: function(name, attribs) {
            if (name === "p" && attribs.class === "lause") {
                begincapt = true;
            }
        },
        ontext: function(text) {
            if (begincapt) say(text);
        },
        onclosetag: function(tagname) {
            if (tagname === "p") {
                begincapt = false;
            }
        }
    }, {
        decodeEntities: true
    });
}

function get_puppu(url, client, channel, line) {
    var parser = new_parser(client, channel);
    request({
        url: url,
        encoding: null
    }, function(error, res, body) {
        if (error) return console.log(error)
        parser.write(iconvlite.decode(body, 'iso-8859-1'));
        parser.end();
    });
}

var puppu = function(client, channel, from, line) {
    var say = function(text) {
        client.say(channel, concat(text, line));
    }
    get_puppu("http://puppulausegeneraattori.fi/", say);
}

var opiskelupuppu = function(client, channel, from, line) {
    var say = function(text) {
        client.say(channel, concat(text, line));
    }
    get_puppu("http://puppulausegeneraattori.fi/aihe/Opiskelijaelama", say);
}

var tyopuppu = function(client, channel, from, line) {
    var say = function(text) {
        client.say(channel, concat(text, line));
    }
    get_puppu("http://puppulausegeneraattori.fi/aihe/Yritysmaailma", say);
}

var itpuppu = function(client, channel, from, line) {
    var say = function(text) {
        client.say(channel, concat(text, line));
    }
    get_puppu("http://puppulausegeneraattori.fi/aihe/Tietotekniikka", say);
}
module.exports = {
    name: "puppulause",
    commands: {
        "!puppu": puppu,
        "!opiskelupuppu": opiskelupuppu,
        "!opuppu": opiskelupuppu,
        "!tyopuppu": tyopuppu,
        "!työpuppu": tyopuppu,
        "!itpuppu": itpuppu
    }
}
