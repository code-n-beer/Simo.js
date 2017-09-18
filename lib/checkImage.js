const request = require('request')

const fileTypes = {
  'png': '89504e47',
  'jpg': 'ffd8',
  'gif': '47494638'
};

const isImage = (url, cb) => {
  var type = '';
  var size;
  var stream = request({
    url: url,
    method: "HEAD"
  }, function(err, headRes) {
    if(err) {
      console.log(err);
      console.log('request fail');
      return callback(err);
    }
    var req = request({ url: url});
    var checkType = true;
    req.on('data', function(data) {
      if(size >= 4) {
        var hex = data.toString('hex', 0, 4);
        // yes this is horrible, but it's copied from tsatter from way back!!!
        for(var key in fileTypes) {
          if(fileTypes.hasOwnProperty(key)) {
            if(hex.indexOf(fileTypes[key]) === 0) {
              cb(null, key)
            }
          }
        }
        cb('not an image')
      }
    })
  }
  )
}

module.exports = isImage
