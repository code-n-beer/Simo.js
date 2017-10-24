const request = require('request');

var seen = [];

var reddit = function(client, channel, from, line) {
    var sub = "";
    try {
        sub = line.split(" ")[1];
    } catch (err) {}
    var url = "http://www.reddit.com/r/" + sub + "/hot.json?sort=new";
    var response;

    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            response = JSON.parse(body);
            var count = 1;
            var topPost = response.data.children[count];
            var topPostImg = topPost.data.url;

            while (seen.indexOf(topPostImg) !== -1) {
                topPost = response.data.children[count];
                topPostImg = topPost.data.url;
                count++;
            }

            seen.push(topPostImg);
            console.log(seen);

            client.say(channel, topPostImg);
        }
    });
}

module.exports = {
    name: "reddit", //not required atm iirc 
    commands: {
        "!reddit": reddit
    }
}