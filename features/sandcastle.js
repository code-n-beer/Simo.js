var SandCastle = require('sandcastle').SandCastle;
var fs = require('fs');
var macroPath = __dirname + '/../lib/macros.js';
var concat = require('../lib/concat.js');
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

  const runScript = (line) => {
    var script = sbox.createScript("exports.main = function() {" + line + "}");

    script.on('exit', function(err, output) {
      console.log('err: ' + err);
      console.log('output: ' + output);
      if(!err) {
       res = JSON.stringify(output);
        res = res.substring(0,400);
        res = res.replace(/(\r\n|\n|\r)/gm,' ');
        res = res.toString();
        res = res.replace(/^"/,'');
        res = res.replace(/"$/,'');
        client.say(channel, macroName[0] === '_' ? concat(res, lineArr.join(" ")) : res);
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

    script.run({arg: lineArr.join(" ")});
  }

  line = line.substring('!run '.length);
  var lineArr = line.split(" ");
  let macroName = ''
  if(macros.hasOwnProperty(lineArr[0])) {
    macroName = lineArr.shift()
    line = macros[macroName];
  }

  const innerMacro = line.match(/!([\+_][a-ö]+)(\$\$(.*)\$\$)?/)
  if(innerMacro && macros.hasOwnProperty(innerMacro[1])) {
    const lineMock = '!run ' + (innerMacro[3] ? innerMacro[1] + ' ' + innerMacro[3] : innerMacro[1])
    const clientMock = {
      say: (_, res) => {
        res = isNaN(parseFloat(res)) ? `"${res}"` : res
        runScript(line.replace(innerMacro[0], res))
      }
    }
    run(clientMock, '', '', lineMock)
  } else {
    runScript(line)
  }
}


var macros = {};
var init = function(config) {
    var macroFile = fs.readFileSync(macroPath);
    macros = JSON.parse(macroFile);
}

var addMacro = function(name, script, callback) {
    if(!['_', '+'].includes(name[0])) {
      callback('error: macro names must begin with \'+\' or \'_\'')
      return
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
    });
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
const printMacro = (client, channel, from, line) =>
    client.say(channel, macros[line.split(' ')[1]])

const listMacros = (client, channel, from, line) =>
    client.say(channel, Object.keys(macros).join(' '))

var replaceAll = function(string, target, replace) {
    return string.replace(new RegExp(target, 'g'), replace);
}

module.exports = {
  name: "eval in a sandbox", //not required atm iirc 
  commands: { 
    "!run": run,
    '!addmacro': newMacro,
    '!delmacro': delMacro,
    '!printmacro': printMacro,
    '!listmacros': listMacros
  },
  init: init
}

