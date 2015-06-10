var Sandbox = require('sandcastle').SandCastle;
//client is used to send stuff
//channel is needed to send stuff using client, but is also the channel's name where the line came from
//line is the full message the user sent
//from is the nick of the user who sent the line
var run = function(client, channel, from, line){
  //console.log(line); //debug
  var sbox = new SandCastle();

  line = line.substring(5);
  var script = sbox.createScript(line);
  script.on('exit', function(err, output) {
    var res = output.replace(/(\r\n|\n|\r)/gm,' ');
    client.say(channel, res);
  });

  script.run();
  /*
  s.run(line, function(output) {
    var res = output.result.replace(/(\r\n|\n|\r)/gm,' ');
    res = res.replace('   ', ' ');
    res = res.replace('  ', ' ');
    output.result = res;
    res = JSON.stringify(output);
    console.log(res);
    console.log(output.console);
    client.say(channel, res); 
  });
  */

}

module.exports = {
  name: "eval in a sandbox", //not required atm iirc 
  commands: { 
    "!run": run,
  }
}

