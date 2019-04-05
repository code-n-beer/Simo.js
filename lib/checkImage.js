const request = require('request')

const fileTypes = {
    'png': '89504e47',
    'jpg': 'ffd8',
    'gif': '47494638'
};

const isImage = (url, cb) => {
    console.log('checking if image')
    var size = 0;
    request({
        url: url,
        method: "HEAD"
    }, function(err, headRes) {
        if (err) {
            console.log(err);
            console.log('request fail');
            return cb(err);
        }
        var req = request({
            url: url
        });

        req.on('data', function(data) {
            console.log('got pic data')
            size += data.length
            if (size >= 4) {
                var hex = data.toString('hex', 0, 4);
                // yes this is horrible, but it's copied from tsatter from way back!!!
                for (var key in fileTypes) {
                    if (fileTypes.hasOwnProperty(key)) {
                        if (hex.indexOf(fileTypes[key]) === 0) {
                            req.abort()
                            req.destroy()
                            return cb(null, key)
                        }
                    }
                }
                req.abort()
                req.destroy()
                return cb('not an image')
            }
            req.abort()
            req.destroy()
        })
    })
}

module.exports = isImage