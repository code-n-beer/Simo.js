var request = require('request');
exports.api = {
  request: function(obj, callback) {
    request(obj, callback);
  },
  setTimeout: function(callback, timeout) {
    setTimeout(callback, timeout);
  },
  require: require
}
