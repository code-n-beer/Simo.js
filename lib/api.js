var request = require('request');
exports.api = {
  request: function(obj, callback) {
    request(obj, callback);
  },
  niksi: function(cb) {
      request('http://thermopylas.fi/ws/nicksit.php', function(a,b,content) {
          cb(content);
      });
  },
  setTimeout: function(callback, timeout) {
    setTimeout(callback, timeout);
  }
}
