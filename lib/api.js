const request = require('request');
const moment = require('moment');
const cheerio = require('cheerio')
const base64 = require('base-64')
const axios = require('axios')
const lodash = require('lodash')
const mathj = require('mathjs')

exports.api = {
  'DOCKER_HOST': process.env.DOCKER_HOST,
  request,
  moment,
  cheerio,
  base64,
  mj: mathj,
  '_': lodash,
  axios,
  setTimeout: function(callback, timeout) {
    setTimeout(callback, timeout);
  },
  rand: (x) => x[~~(Math.random()*x.length)]
}
