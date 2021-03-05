const request = require('request');

var seen = [];

var reddit = function(client, channel, from, line) {
    var sub = "";
    try {
        sub = line.split(" ")[1];
    } catch (err) {}
    var url = "http://www.reddit.com/r/" + sub + "/hot.json?sort=new";

    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            response = JSON.parse(body);
            var count = 1;
            var topPost = response.data.children[count];
            if (!topPost) {
                return;
            }
            var topPostURL = topPost.data.url;

            while (seen.indexOf(topPostURL) !== -1 || topPost.pinned) {
                topPost = response.data.children[count];
                topPostURL = topPost.data.url;
                count++;
            }

            seen.push(topPostURL);
            //console.log(seen);

            client.say(channel, topPostURL);
        }
    });
}

module.exports = {
    name: "reddit", //not required atm iirc 
    commands: {
        "!reddit": reddit
    }
}
