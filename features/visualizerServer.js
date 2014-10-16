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
