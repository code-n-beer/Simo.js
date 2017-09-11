var request = require('request');
const moment = require('moment');
const cheerio = require('cheerio')
const base64 = require('base-64')
exports.api = {
  request,
  moment,
  cheerio,
  base64,
 // cmd,
  niksi: function(cb) {
      request('http://thermopylas.fi/ws/nicksit.php', function(a,b,content) {
          cb(content.replace('\n', ''));
      });
  },
  setTimeout: function(callback, timeout) {
    setTimeout(callback, timeout);
  }
}
