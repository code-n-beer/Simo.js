const TimerDB = require('./timerdb').TimerDB,
    _ = require('underscore'),
    moment = require('moment');

var timerdb = new TimerDB();

module.exports.TimerPoller = TimerPoller;

function TimerPoller(client, interval) {
    timerdb.poll(interval).on('receive', function(rows, err) {
        _.each(rows, function(row) {
            var timeout = row.date - moment().unix();
            timeout = (timeout <= 0) ? 0 : timeout * 1000;
            setTimeout(function() {
                client.say(row.channel, row.message);
                timerdb.done(row.date);
            }, timeout);
        });
    });
}