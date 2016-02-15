var fiftyshadesgen = require('../lib/50shadesgen/src/js/generator.js');
var concat = require('../lib/concat.js');


var fiftyshades = function(client, channel, from, line){
    var sentences = concat(fiftyshadesgen.generate(1), line);

    client.say(channel, sentences); 
}

module.exports = {
    name: "50shades",
    commands: { 
        "!50shades": fiftyshades,
    }
}
