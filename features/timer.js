
var timer = function(client, channel, from, line){
  var say = function(msg) {
    client.say(channel, msg);
  }

  var line_arr = line.split(" ");
  var date_strs = ['HH:mm','DD.MM','DD.MM HH:mm','DD.MM.YYYY'];

module.exports = {
    name: "test", //not required atm iirc 
    commands: { 
       "!timer": timer,
    }
}
