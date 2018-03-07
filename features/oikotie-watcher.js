const request = require('request')
const _ = require('lodash')
let client
const url = 'https://asunnot.oikotie.fi/api/cards?cardType=106&limit=24&locations=%5B%5B64,6,%22Helsinki%22%5D%5D&offset=0&price%5Bmax%5D=700&price%5Bmin%5D=10&size%5Bmax%5D=150&size%5Bmin%5D=30&sortBy=published_desc'
const timeout = 1000 * 60 * 10  // once every 10 mins
// eslint-disable-next-line no-unused-vars
const init = function(config, client_) {
  client = client_
    setInterval(() => fetch(url), timeout)
    fetch(url)
}

const fetch = (url) => request(url, parse)

  let oldResults = []
  const parse = (err, res, body) => {
    if (err) console.log(`err: ${err}`)
      const results = JSON.parse(body).cards

        if (!oldResults[0]) { // First load
          console.log('first load, not reporting')
            //report(results[0])
            return oldResults = results
        } else if (oldResults[0].id !== results[0].id) { // haz new stuff
          _.takeWhile(results, o => o.id !== oldResults[0].id).map(report)
            oldResults = results
        } else {
          console.log('nothing new to report')
        }
  }

const format = (item) => `${item.price} | ${item.size}m2 | ${item.roomConfiguration} | ${item.buildingData.address}, ${item.buildingData.district} | ${item.url} | ${item.description}`

const report = (item) => {
  client.say('#cnbhq', format(item))
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
