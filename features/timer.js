
var timer = function(client, channel, from, line){
    line = line.toString();
    console.log(channel);
    console.log(from);
    console.log(line);
    var splitd = "";
    var time = 0;
    try{
        splitd = line.split(" ");
        time = splitd[1];
    }
    catch(err)
    {
        client.say(channel, "Invalid input: " + err);
        return;
    }
    splitd.splice(0, 2);
    var msg = line;
    msg += " left by " + from;
    var num = 0;
    try {
        num = parseInt(time);
    }
    catch(err){
        client.say(channel, "Invalid input: " + err); 
        return;
    }
    if(num >= 2147483647)
    {
        client.say(channel, "Value too big");
        return;
    }

    num *= 1000;
    console.log("TIME: !!!: " + num);
    if(typeof num === 'number')
    {
        client.say(channel, "Timer set to: " + (num / 1000) + " seconds from now");
        setTimeout(target, num, msg, client, channel); 
    }
    /*
    else if(typeof type === 'string')
    {
        runAtDate(
    }
    */
    else
    {
        client.say(channel, "Invalid input"); 
    }
}

var target = function(msg, client, channel)
{
    client.say(channel, msg);
}

var runAtDate = function(date, func){
    var now = (new Date()).getTime();
    var then = date.getTime();
    var diff = Math.max((then - now), 0);
    if (diff > 0x7FFFFFFF) //setTimeout limit is MAX_INT32=(2^31-1)
        setTimeout(function() {runAtDate(date, func);}, 0x7FFFFFFF);
    else
        setTimeout(func, diff);
}

module.exports = {
    name: "test", //not required atm iirc 
    commands: { 
       "!timer": timer,
    }
}
