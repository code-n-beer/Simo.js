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

        // we might get the response in multiple chunks :--------)
        let response = ""
        req.on('data', (data) => {
            response += data;
        })
        req.on('end', function() {
            console.log('got pic data')
            size += response.length
            if (size >= 4) {
                var hex = response.toString('hex', 0, 4);
                // yes this is horrible, but it's copied from tsatter from way back!!!
                for (var key in fileTypes) {
                    if (fileTypes.hasOwnProperty(key)) {
                        if (hex.indexOf(fileTypes[key]) === 0) {
                            req.abort()
                            return cb(null, key)
                        }
                    }
                }
                req.abort()
                return cb('not an image')
            }
        })
    })
}

module.exports = isImage