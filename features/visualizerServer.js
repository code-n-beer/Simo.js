

/*
 *   COPY THIS FILE TO CREATE YOUR OWN FEATURE 
 *   DON'T PUT YOUR FEATURE WITHIN THIS FILE
 */
var count = 0;
//client is used to send stuff
//channel is needed to send stuff using client, but is also the channel's name where the line came from
//line is the full message the user sent
//from is the nick of the user who sent the line


var server;
var ws = require("nodejs-websocket");
var init = function(config){
    server = ws.createServer(function (conn) {
        console.log("new connection");
        conn.on("text", function(str) {
            console.log("Received: " + str);
        });
        conn.on("close", function (code, reason) {
            console.log("connection closed");
        });
    }).listen(config.websocketport);

    console.log(server);

    console.log("visualizer was initialized yay");
}

var draw = function(client, channel, from, line){
    //console.log("hi");
    server.connections.forEach(function (conn) {
        //conn.sendText(from + ": " + line);
        conn.sendText(line);
    });
    


    //console.log(line); //debug
    //count++;
    //var ret =  "Feature has been ran " + count + " times.";
    //client.say(channel, ret); 
}

module.exports = {
    name: "test", //not required atm iirc 
    init: init,
    commands: { 
       "!draw": draw,
    },
    regexes: {
        ".*": draw,
    },
}
