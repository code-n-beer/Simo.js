var request = require('request'),
    spotifyUri = require('spotify-uri'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    imgs = /(.+)\.(gif|jpg|jpeg|gifv|webm|png)$/

const isImage = require('./checkImage.js')

const apiKey = JSON.parse(fs.readFileSync(__dirname + '/../settings.json')).azure.vision

module.exports.UrlTitle = UrlTitle;

function UrlTitle() {}

UrlTitle.prototype.getTitle = function(str, callback) {

    var url = String(str.match(/http\S*/));
    if (!url || url === 'null') {
        return;
    }

    if (str.indexOf('spotify:') != -1) {
        url = String(str.match(/spotify:\S*/));
        console.log('parsed uri: ' + url);
    }

    if (url.indexOf('spotify') != -1) {
        url = spotifyUri.formatOpenURL(spotifyUri.parse(url));
    }

    var imgurImg = imgs.exec(url);
    if (url.indexOf('imgur') != -1 && imgurImg) {
        url = imgurImg[1];
    }

    if (!url || url === 'null') {
        return;
    }


    try {
        console.log('checking if image')
        isImage(String(url), (err, type) => {
            if (!err && type) {
                console.log("image was " + type)
                console.log(url)
                console.log(String(url))
                request.post({
                        url: 'https://westeurope.api.cognitive.microsoft.com/vision/v1.0/analyze?visualFeatures=Description&language=en',
                        body: JSON.stringify({
                            url: url
                        }),
                        headers: {
                            'Ocp-Apim-Subscription-Key': apiKey
                        }
                    },
                    (e, r, b) => {
                        if (e) return console.log('image api failed: ') || console.log(e)
                        try {
                            const s = JSON.parse(b).description.captions[0]
                            callback(`${s.text} (${~~(s.confidence*100)}% confidence)`)
                        } catch (e) {
                            console.log('image description failed')
                            console.log(b)
                        }
                    }
                )
            } else {
                console.log('not an image, check title')
                request({
                    url: String(url),
                    headers: {
                        'User-Agent': 'SimoBot/1.0 (https://github.com/code-n-beer/Simo.js)',
                        'Accept-Language': 'fi;q=1, en;q=0.9'
                    }
                }, function(error, response, body) {
                    if (error) {
                        console.log('urltitle error:', response);
                        return;
                    }
                    var $ = cheerio.load(body);
                    var titleText = $('head title').text();
                    if (titleText) {
                        titleText = titleText.trim();
                        titleText = titleText.replace(/(\r\n|\n|\r)/gm, " \\ ");
                        if (titleText.length > 500) {
                            titleText = titleText.substring(0, 500) + '...'
                        }
                        callback(titleText)
                    }
                });
            }
        })
    } catch (err) {
        console.log('urltitle:', err);
    }
};