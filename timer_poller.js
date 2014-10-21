var sqlite3 = require('sqlite3').verbose()
  , db = new sqlite3.Database('resources/simojs.sqlite')
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore');

module.exports.init = init;
module.exports.TimerDB = TimerDB;

function init(callback) {
  var create_table = "CREATE TABLE IF NOT EXISTS timer \
                    date INT NOT NULL UNIQUE PRIMARY KEY, \
                    channel VARCHAR(40) NOT NULL \
                    from VARCHAR(40) NOT NULL \
                    message VARCHAR(510) NULL \
                    disabled BOOLEAN";

  db.serialize(function() {
    db.run(create_table, callback);
  });
};

function TimerDB() {

};

TimerDB.prototype.poll = function() {
  this.emitter = new EventEmitter();
  var interval = setInterval(_.bind(this._poll, this), 60000);
  return this.emitter;
};

TimerDB.prototype._poll = function() {
  var _this = this;
  var get_dates = "SELECT * FROM timer WHERE \
                   date <= DATETIME('now','+1 minute') AND disabled = 0";
  var lock_row =  "UPDATE timer SET disabled = 1 WHERE \
                   date = %s";

  db.serialize(function() {
    db.all(get_dates, function(err, rows) {
      if(err) {
        console.log('TimerDB:',err);
        return;
      }
      _this.emitter.emit('events', rows);
    });
    db.run(lock_row, function(err) {
      if(err) {
        console.log('TimerDB:','could not lock rows; duplicate events may ensue');
      }
    });
  });

};

TimerDB.prototype.schedule = function(date, channel, from, msg, callback) {

};
