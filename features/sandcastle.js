var SandCastle = require('sandcastle').SandCastle;
//client is used to send stuff
//channel is needed to send stuff using client, but is also the channel's name where the line came from
//line is the full message the user sent
//from is the nick of the user who sent the line
var run = function(client, channel, from, line){
  //console.log(line); //debug
  var sbox = new SandCastle({
    api: __dirname + '/../lib/api.js',
      memoryLimitMB: 100,
      timeout: 3000
  });

  line = line.substring(5);
  var script = sbox.createScript("exports.main = function() {" + line + "}");

  script.on('exit', function(err, output) {
    console.log('err: ' + err);
    console.log('output: ' + output);
    if(!err) {
      res = JSON.stringify(output);
      res = res.replace(/(\r\n|\n|\r)/gm,' ');
      client.say(channel, res);
    }
    else {
      res = err.toString();
      client.say(channel, res);
    }
    sbox.kill();
  });
  script.on('timeout', function() {
    console.log('script timed out');
    client.say(channel, 'script timed out');
  });

  script.run();
}

module.exports = {
  name: "eval in a sandbox", //not required atm iirc 
  commands: { 
    "!run": run,
  }
}

