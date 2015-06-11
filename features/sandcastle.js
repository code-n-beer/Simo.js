var SandCastle = require('sandcastle').SandCastle;
var fs = require('fs');
var macroPath = __dirname + '/../lib/macros.js';
//client is used to send stuff
//channel is needed to send stuff using client, but is also the channel's name where the line came from
//line is the full message the user sent
//from is the nick of the user who sent the line
var sbox = new SandCastle({
  api: __dirname + '/../lib/api.js',
    memoryLimitMB: 1000,
    timeout: 10000
});
var run = function(client, channel, from, line){
  //console.log(line); //debug

  line = line.substring('!run '.length);
  for(var macro in macros) {
    if(macros.hasOwnProperty(macro)) {
        line = line.replace(macro, macros[macro]);
    }
  }
  var script = sbox.createScript("exports.main = function() {" + line + "}");

  script.on('exit', function(err, output) {
    console.log('err: ' + err);
    console.log('output: ' + output);
    if(!err) {
      res = JSON.stringify(output);
      res = res.substring(0,400);
      res = res.replace(/(\r\n|\n|\r)/gm,' ');
      res = res.toString();
      client.say(channel, res);
    }
    else {
      res = err.toString();
      client.say(channel, res);
    }
  });
  script.on('timeout', function() {
    console.log('script timed out');
    client.say(channel, 'script timed out');
  });

  script.run();
}


var macros = {};
var init = function(config) {
    var macroFile = require(macroPath);
    macros = JSON.parse(macroFile);
}

var addMacro = function(name, script, callback) {
    if(name.indexOf('_') !== 0) {
        name = '_' + name;
    }
    macros[name] = script;
    writeMacros(callback);
}

var writeMacros = function(callback) {
    fs.writeFile(macroPath, JSON.stringify(macros), function(err) {
        callback(err);
    });
}

var newMacro = function(client, channel, from, line) {
    line = line.substring('!addmacro '.length);
    var words = line.split(' ');
    var name = words[0];
    var script = line.substring(name.length + 1);
    addMacro(name, script, function(err) {
        if(err) {
            console.log(err);
            client.say(channel, err);
        }
        else {
            client.say(channel, 'added macro');
        }
    }
}

var delMacro = function(client, channel, from, line) {
    line = line.substring('!delmacro '.length);
    var words = line.split(' ');
    var name = words[0];
    delete macros[name];
    writeMacros(function() {
        client.say(channel, 'removed');
    });
}

module.exports = {
  name: "eval in a sandbox", //not required atm iirc 
  commands: { 
    "!run": run,
    '!addmacro': newMacro
    '!delmacro': delMacro
  }
}

