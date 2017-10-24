const _ = require('underscore'),
    moment = require('moment'),
    TimerDB = require('../lib/timerdb').TimerDB;

var timerdb = new TimerDB(),
    date_strs = ['HH:mm', 'DD.MM', 'DD.MM HH:mm', 'DD.MM.YYYY', 'DD.MM.YYYY HH:mm'],
    help_str = "Supported formats: [number]s/m/h, " + date_strs.join(", ");

var timer = function(client, channel, from, line) {
    var say = function(msg) {
        client.say(channel, msg);
    }

    var line_arr = line.split(" ");

    if (_.size(line_arr) < 2 || line_arr[1] == '') {
        say(help_str);
        return;
    }

    var first_arg = line_arr[1];
    var date;
    var moment_delay = moment().add(
        initial(first_arg),
        last(first_arg));
    var moment_date = moment(_.rest(line_arr).join(" "), date_strs);

    if (first_arg.match(/^[0-9]{1,3}[a-zM]$/) &&
        moment_delay.isValid()) {
        date = moment_delay;
    } else if (first_arg.match(/(:|\.)/) &&
        moment_date.isValid()) {
        date = moment_date;
    } else {
        say(help_str);
        return;
    }

    if (date.unix() < moment().unix()) {
        say("Timer not set: provided date is in the past");
        return;
    }

    var message = line.slice(1) + " left by " + from;
    var info_prefix = "Timer set to: ";

    if (date.unix() <= moment().add(1, "minute").unix()) {
        say(info_prefix + date.toString());
        setTimeout(_.partial(say, message),
            (date.unix() - moment().unix()) * 1000);
    } else {
        timerdb.schedule(date.unix(), channel, from, message, function(err, date) {
            if (!err) {
                say(info_prefix + moment.unix(date).toString());
            } else {
                say("Timer not set: database failure");
            }
        });
    }
}

function last(str) {
    return str.slice(-1);
}

function initial(str) {
    return str.slice(0, str.length - 1);
}





module.exports = {
    name: "timer",
    commands: {
        "!timer": timer,
    }
}