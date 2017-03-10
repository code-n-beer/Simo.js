const express = require('express')
const app = express()
let client

app.get('/auth', (req, res) => {
  res.sendFile('../resources/webauth.html')
})

app.post('/moro', function (req, res) {
  client.say('#cnbhq', 'Joku hiippailee HQ:lla')
  res.end()
})

app.listen(8321, function () {
  console.log('Example app listening on port 8321!')
})

const init = function(_, client_) {
  client = client_
}

module.exports = {
  name: 'server', //not required atm iirc
  init: init
}
