var request = require('request');
const moment = require('moment');
exports.api = {
  request,
  moment,
  niksi: function(cb) {
      request('http://thermopylas.fi/ws/nicksit.php', function(a,b,content) {
          cb(content.replace('\n', ''));
      });
  },
  setTimeout: function(callback, timeout) {
    setTimeout(callback, timeout);
  }
}
