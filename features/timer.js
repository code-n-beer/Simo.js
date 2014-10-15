var util = require('util');

var timer = function(client, channel, from, line){
    var say = function(msg)
    {
        client.say(channel, msg);
    }
    line = line.toString();
    console.log(channel);
    console.log(from);
    console.log(line);
    var splitd = "";
    var num;
    try{
        splitd = line.split(" ");
        num = splitd[1];
    }
    catch(err)
    {
        client.say(channel, "Invalid input: " + err);
        return;
    }
   //splitd.splice(0, 2);
    var msg = line;
    msg += " left by " + from;
    if(num >= 2147483647)
    {
        client.say(channel, "Value too big");
        return;
    }

    console.log("TIME: !!!: " + num);
    if(!isNaN(num))
    {
        num *= 1000;
        client.say(channel, "Timer set to: " + (num / 1000) + " seconds from now");
        setTimeout(say, num, msg, client, channel); 
        return;
    }
    if(isTime(num))
    {
        console.log("IS TIME");
        var now = new Date();
        num = util.format("%s/%s/%s %s", now.getFullYear(), now.getMonth()+1, now.getDate(), num);
        console.log(num);
    }
    if(isDate(num))
    {
        console.log("IS DATE");
        // take also clock tiem
        num += (isTime(splitd[2])) ? " " + splitd[2] : "";
        var date = new Date(num);
        say("Timer set to: " + date.toString());
        runAtDate(date, function() { say(msg) });
    }
    else
    {
        client.say(channel, "Invalid input"); 
    }
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

var isDate = function(str) {
    return !isNaN(new Date(str).getTime());
}
var isTime = function(str) {
    return str && str.indexOf(":") > 1;
}

module.exports = {
    name: "test", //not required atm iirc 
    commands: { 
       "!timer": timer,
    }
}
