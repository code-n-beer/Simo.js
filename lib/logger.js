const sqlite3 = require('sqlite3').verbose(),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    moment = require('moment'),
    async = require('async');

var db = new sqlite3.Database('/simojs-data/simojs-logs.sqlite', function(err) {
    if (err) {
        console.log('LogDB:', 'could not open database file from: /simojs-data/simojs-logs.sqlite');
        console.log('Using in-memory database instead');
        return new sqlite3.Database(':memory:');
    } else {
        console.log("LogDB: persistent db opened")
    }
});

function LogDB() {
    var create_table = "CREATE TABLE IF NOT EXISTS logs \
                    (id integer primary key \
                    timestamp datetime default current_timestamp, \
                    channel VARCHAR(40) NOT NULL, \
                    sender VARCHAR(40) NOT NULL, \
                    message VARCHAR(510) NULL)";

    db.serialize(function() {
        db.run(create_table);
    });

}

const insertRowQuery = 'INSERT INTO poems \
                         (channel, sender, message) \
                         VALUES (?, ?, ?)'
function addQuery(channel, sender, message, cb) {
  db.run(insertRowQuery, channel, sender, message, (err) => {
    cb(err)
  })
}

LogDB()


module.exports = {
    addQuery
}
