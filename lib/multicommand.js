const async = require('async'), request = require('request'), _ = require('underscore'), qs = require('querystring');

module.exports.MultiCommand = MultiCommand;

function MultiCommand(commands, maxDepth) {
    this.commands = commands;
    this.maxDepth = maxDepth;
}

MultiCommand.prototype.exec = function(to, from, msg, callback) {
    var _this = this;
    var msgArr = msg.split(" ");
    var depth = 0;

    // HANDLE DEM MSGS
    // (move this to a reasonable place)
    async.whilst(function() {
        return _checkCommand(msgArr[0]) &&
            msgArr[0].length < 10000 &&
            depth < _this.maxDepth;
    }, function(callback) {
        if (!_checkCommand(_.last(msgArr))) {
            msgArr[msgArr.length - 2] = _.last(msgArr, 2).join(" ");
            msgArr = _.initial(msgArr);
            callback();
            return;
        }
        depth++;
        var message = _.last(msgArr);
        var cmd = message.split(" ")[0];

        var myClient = { // imitate a client
            say: function(chan, msg) {
                msgArr[msgArr.length - 1] = msg;
                callback();
            }
        }

        const runCommand = (comm = cmd, msg = message) => {
	    console.log('running command for', msg)
            var functions = _this.commands[comm];
            console.log('runcommand comm', comm)
            //console.log("functions: " + functions);
            functions.forEach(function(func) {
		console.log('functions for eaching msg', msg)
                func(myClient, to, from, msg);
            });
        }

        // SIMO.JS FEATURES
        if (_this.commands.hasOwnProperty(cmd)) runCommand(cmd)
        else {
            // PYTHON SIMO FEATURES
            var url = "http://pythonsimo:8888";
            var post_data = qs.stringify({
                command: message,
                sender: from
            });
            request.post({
                url: url,
                body: post_data,
                timeout: 32 * 1000
            }, function(e, r, body) {
                if (e) {
                    console.log('multicommand error code:', e.code)
                    console.log('multicommand:', e);
                    if (cmd.match(/^!(_|\+)/)) runCommand('!run', `!run ${message.slice(-message.length+1)}`)
                    return;
                }
                if (!body) {
                    console.log('in fact everybody is !body')
                    if (cmd.match(/^!(_|\+)/)) runCommand('!run', `!run ${message.slice(-message.length+1)}`)
                    return;
                }
                console.log('returned', body)
                myClient.say(to, body);
            });
        }
    }, function(err) {
        console.log('async whilst err', err)
        if (msgArr.length > 1) {
            callback();
            return;
        }
        callback(msgArr[0]);
    });
}

function _checkCommand(cmd) {
    return (cmd &&
        cmd.indexOf('!') === 0)
}
