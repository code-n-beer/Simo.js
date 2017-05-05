var request = require('request');
const moment = require('moment');
const cheerio = require('cheerio')
//const MultiCommand = require('./lib/multicommand').MultiCommand;
//const cmd = MultiCommand.exec.bind(MultiCommand, 'macro', 'macro')
exports.api = {
  request,
  moment,
  cheerio,
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
