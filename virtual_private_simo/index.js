const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/run', function (req, res) {
  const exec = require('child_process').exec
  const cmd = req.body.command

  exec(cmd, function(error, stdout, stderr) {
    res.send({error, stdout, stderr})
  })
})

app.listen(3500, function () {
  console.log('Example app listening on port 3500!')
})
