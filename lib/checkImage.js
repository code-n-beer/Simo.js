const request = require('request')

const fileTypes = {
    'png': '89504e47',
    'jpg': 'ffd8',
    'gif': '47494638'
};

const isImage = (url, cb) => {
    console.log('checking if image')
    var size = 0;

    var req = request({
        url: url,
        headers: {
            'Range': 'bytes=0-4'
        }
    });

    let cooldown = false
    req.on('data', function(data) {
        req.destroy()
        if (!cooldown) {
            cooldown = true
            console.log('got pic data')
            size += data.length
            if (size >= 4) {
                var hex = data.toString('hex', 0, 4);
                // yes this is horrible, but it's copied from tsatter from way back!!!
                for (var key in fileTypes) {
                    if (fileTypes.hasOwnProperty(key)) {
                        if (hex.indexOf(fileTypes[key]) === 0) {
                            return cb(null, key)
                        }
                    }
                }
                return cb('not an image')
            }
        }
    })
}

module.exports = isImage