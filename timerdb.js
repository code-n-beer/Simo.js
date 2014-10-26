var sqlite3 = require('sqlite3').verbose()
  , db = new sqlite3.Database('resources/simojs.sqlite')
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , moment = require('moment');

module.exports.TimerDB = TimerDB;

function init(callback) {
};

function TimerDB() {
  var create_table = "CREATE TABLE IF NOT EXISTS timer \
                    (date INT NOT NULL UNIQUE PRIMARY KEY, \
                    channel VARCHAR(40) NOT NULL, \
                    sender VARCHAR(40) NOT NULL, \
                    message VARCHAR(510) NULL, \
                    disabled BOOLEAN)";

  db.serialize(function() {
    db.run(create_table);
  });
};

TimerDB.prototype.poll = function(interval) {
  this.emitter = new EventEmitter();
  setInterval(_.bind(this._poll, this, interval), interval*1000);
  return this.emitter;
};

TimerDB.prototype._poll = function(interval) {
  var _this = this;
  var future = moment().add(interval, "seconds").unix();
  var past = moment().subtract(interval, "seconds").unix();
  var get_dates = "SELECT * FROM timer WHERE \
                   (date <= ? AND disabled = 0) OR \
                   (date <= ?)";
  var lock_row =  "UPDATE timer SET disabled = 1 WHERE \
                   date <= ?";

  db.all(get_dates, future, past, function(err, rows) {
    if(err) {
      console.log('TimerDB:',err);
      return;
    }
    db.run(lock_row, future, function(err) {
      if(err) {
        console.log('TimerDB:','could not lock rows; duplicate alerts may ensue');
      }
    });
    _this.emitter.emit('receive', rows);
  });

};

TimerDB.prototype.schedule = function(date, channel, sender, message, callback) {
  var insert_row = "INSERT INTO timer \
                    (date, channel, sender, message) \
                    VALUES (?, ?, ?, ?)";
  db.run(insert_row, date, channel, sender, message, function(err) {
    if(err) 
      console.log('TimerDB:','error scheduling alert:',err);
    callback(err);
  });
};

TimerDB.prototype.done = function(date, callback) {
  var remove_row = "DELETE FROM timer WHERE \
                    date = ?";
  db.run(remove_row, date, function(err) {
    if(err) {
      console.log('TimerDB:','error removing alert:',err);
    }
  });
};
