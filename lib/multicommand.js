var async   = require('async')
  , request = require('request')
  , _       = require('underscore')
  , qs      = require('querystring');


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
    return _checkCommand(msgArr) &&
    msgArr[0].length < 510 &&
    depth < _this.maxDepth;
  }, function(callback) {
    if(!_checkCommand(_.last(msgArr))) {
      msgArr[msgArr.length - 2] =  _.last(msgArr, 2).join(" ");
      msgArr = _.initial(msgArr);
      callback();
      return;
    }
    depth++;
    var message = _.last(msgArr);
    var cmd = message.split(" ")[0];

    var myClient = {    // imitate a client
      say: function(chan, msg) {
             msgArr[msgArr.length - 1] = msg;
             callback();
           }
    }

    // SIMO.JS FEATURES
    if(_this.commands.hasOwnProperty(cmd))
    {
      var functions = _this.commands[cmd];
      //console.log("functions: " + functions);
      functions.forEach(function(func) {
        func(myClient, to, from, message);
      });
    } else {
      // PYTHON SIMO FEATURES
      var url = "http://localhost:8889";
      var post_data = qs.stringify({ command: message, sender: from });
      request.post({url:url, body:post_data}, function(e, r, body) {
        if(e) {
          console.log('multicommand:', e);
          myClient.say(to, 'fail');
          return;
        }
        if(!body) {
          myClient.say(to, '');
          return;
        }
        // fixes urltitle
        if(msgArr[0].indexOf('!') !== 0) {
          msgArr = body;
        }
        myClient.say(to, body);
      });
    }
  }, function() {
    if(msgArr.length > 1) {
      callback();
      return;
    }
    callback(msgArr[0]);
  });
}

function _checkCommand(cmd) {
  if(_.isArray(cmd)) {
    return _.any(cmd, _checkCommand);
  }
   return cmd &&
          (cmd.indexOf('!') === 0 ||
          cmd.indexOf('http') === 0 ||
          cmd.indexOf('www') === 0);
}
