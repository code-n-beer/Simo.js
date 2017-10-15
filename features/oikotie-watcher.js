const request = require('request')
const _ = require('lodash')
let client
const url = 'https://asunnot.oikotie.fi/api/cards?cardType=106&limit=24&locations=%5B%5B64,6,%22Helsinki%22%5D%5D&offset=0&price%5Bmax%5D=700&price%5Bmin%5D=10&size%5Bmax%5D=150&size%5Bmin%5D=30&sortBy=published_desc'
const kommuuniUrl = 'https://asunnot.oikotie.fi/api/cards?cardType=101&limit=24&locations=%5B%5B64,6,%22Helsinki%22%5D%5D&offset=0&price%5Bmax%5D=1800&price%5Bmin%5D=1000&roomCount%5B%5D=5&roomCount%5B%5D=6&roomCount%5B%5D=4&roomCount%5B%5D=7&size%5Bmin%5D=70&sortBy=published_desc'

const timeout = 1000 * 60 * 10  // once every 10 mins

let oldResults = []
let oldResults2 = []

// eslint-disable-next-line no-unused-vars
const init = function(config, client_) {
  client = client_

  setInterval(() => oldResults = fetch(url, reporter(oldResults, "#cnbhq")), timeout)
  setInterval(() => oldResults2 = fetch(kommuuniUrl, reporter(oldResults2, "#cnb-kommuuni")), timeout)
  oldResults = fetch(url, reporter(oldResults, "#cnbhq"))
  oldResults2 = fetch(kommuuniUrl, reporter(oldResults2, "#cnb-kommuuni"))
}

const reporter = (oldResults, channel) => results => {
  if (!oldResults[0]) { // First load
    console.log('first load, not reporting')
  } else if (oldResults[0].id !== results[0].id) { // haz new stuff
    _.takeWhile(results, o => o.id !== oldResults[0].id).map(report(channel))
  }
  return results
}

const fetch = (url, cb) => request(url, parse(cb))

const parse = cb => (err, res, body) => {
  if (err) return console.log(`err: ${err}`)
  cb(JSON.parse(body).cards)
}

const format = (item) => `${item.price} | ${item.size}m2 | ${item.roomConfiguration} | ${item.buildingData.address}, ${item.buildingData.district} | ${item.url} | ${item.description}`

const report = channel => item => {
  client.say(channel, format(item))
}

// eslint-disable-next-line no-unused-vars
const latest = function(client, channel, from, line){
  try {
    const idx = line.split(' ').length > 1 ? parseInt(line.split(' ')[1]) : 0
    client.say(channel, format(oldResults[idx]))
  }
  catch(e) {
  }
}

module.exports = {
  name: 'homma', //not required atm iirc
  commands: {
    '!latest': latest,
  },
  init: init
}
