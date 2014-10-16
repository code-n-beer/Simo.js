var anagram = require('anagram');

var ana = function(client, channel, from, line){
    var text = line.split(" ")[1];
    if(text == 'en'){
        dict = 'twl06.js';
        text = line.split(" ")[2];
    } else {
        dict = 'sanat.js';
    } 
    if(text.length < 3) {
        return;
    }

    anagram.init('./resources/'+dict, function(err){
        if (err) throw err;
        anagram.findAnagrams(text, function(err, anagrams){
            var result = [];
            for(var n in anagrams.items[text.length.toString()]){
                result.push(anagrams.items[text.length.toString()][n].w);
            }
            for( var i in result){
                if(result[i] == anagrams.input){
                    result.splice(i, 1);
                }
            }
            if(result.length == 0) {
                client.say(channel, 'No anagrams for ' + anagrams.input);
                return;
            }
            if(result.length > 1) {
                var msg = 'Anagrams for ' + anagrams.input + ': ' + result.join(', ');
            } else {
                var msg = 'Anagram for ' + anagrams.input + ': ' + result[0];
            }
            client.say(channel, msg);
        });
    });
}

module.exports = {
    name: "anagram",
    commands: {
        "!ana": ana,
    }
}
