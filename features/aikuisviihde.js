var request = require('request');

var gonewild = function(client, channel, from, line) {
	var url = "http://www.reddit.com/r/gonewild/hot.json?sort=new";
	var response;

	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    response = JSON.parse(body);
	    var topPost = response.data.children[1];
	    var topPostImg = topPost.data.url;
	    client.say(channel, topPostImg);
	  }
	});
}

module.exports = {
    name: "gonewild", //not required atm iirc 
    commands: { 
       "!gw": gonewild
    }
}
