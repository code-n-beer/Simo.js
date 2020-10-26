const request = require('request');
const moment = require('moment');
const cheerio = require('cheerio')
const base64 = require('base-64')
const axios = require('axios')
const nj = require('numjs')
const sendMetric = require('../../../lib/simoInflux').sendMetric;
const lodash = require('lodash')
const mathj = require('mathjs')
//const sendMetric = require('../../../lib/simoInflux').sendMetric;

exports.api = {
  'DOCKER_HOST': process.env.DOCKER_HOST,
  request,
  moment,
  cheerio,
  base64,
  nj,
  mj: mathj,
  '_': lodash,
  axios,
 // sendMetric: sendMetric,
  niksi: function(cb) {
      request('http://thermopylas.fi/ws/nicksit.php', function(a,b,content) {
          cb(content.replace('\n', ''));
      });
  },
  setTimeout: function(callback, timeout) {
    setTimeout(callback, timeout);
  },
  rand: (x) => x[~~(Math.random()*x.length)]
}
