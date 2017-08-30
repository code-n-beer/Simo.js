const serializeError = require('serialize-error');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/run', function (req, res) {
  console.log('got a new command')
  const exec = require('child_process').exec
  const cmd = req.body.command
  console.log(`got ${req.body.command}`)

  exec(cmd, function(error, stdout, stderr) {
    let errormsg;
    if(error) {
      errormsg = serializeError(error)
    }
    console.log(errormsg, stdout, stderr)
    res.send({error: errormsg, stdout, stderr})
  })
})

app.listen(3500, function () {
  console.log('Example app listening on port 3500!')
})
