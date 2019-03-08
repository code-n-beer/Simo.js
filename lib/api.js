const request = require('request');
const moment = require('moment');
const cheerio = require('cheerio')
const base64 = require('base-64')
const axios = require('axios')
const influx = require('influx');

const influxdb = new influx.InfluxDB({
  host: 'influxdb',
  database: 'simo',
  port:8086
});

const sendMetric = function(metricName, value, tags="") {
  let parsedTags = {}
  if (tags.length > 0){
    tags.split(",").forEach(tag => {
      const parts = tag.split(":")
      const key = parts[0]
      const value = parts[1]
      parsedTags[key] = value
    })
  }

  influxdb.writePoints([{
    measurement: metricName,
    tags: parsedTags,
    fields: { value: value }
  }])
}

exports.api = {
  'DOCKER_HOST': process.env.DOCKER_HOST,
  request,
  moment,
  cheerio,
  base64,
  axios,
  sendMetric,
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
