var request = require('request'),
    spotifyUri = require('spotify-uri'),
    cheerio = require('cheerio'),
    imgs = /(.+)\.(gif|jpg|jpeg|gifv|webm|png)$/;

module.exports.UrlTitle = UrlTitle;

function UrlTitle() {}

UrlTitle.prototype.getTitle = function(str, callback) {

    var url = String(str.match(/http\S*/));

    if (str.indexOf('spotify:') != -1) {
        url = String(str.match(/spotify:\S*/));
        console.log('parsed uri: ' + url);
    }

    if (url.indexOf('spotify') != -1) {
        url = spotifyUri.formatOpenURL(spotifyUri.parse(url));
    }

    var imgurImg = imgs.exec(url);
    if(url.indexOf('imgur') != -1 && imgurImg) {
        url = imgurImg[1];
    }

    try {
        request(String(url), function (error, response, body) {
            var $ = cheerio.load(body);
            var titleText = $('head title').text();
            if (titleText) {
                titleText = titleText.trim();
                if (titleText.indexOf('\n') > -1) {
                    titleText = titleText.substring(0, titleText.indexOf('\n'));
                }
                if (titleText.length > 500) {
                    titleText = titleText.substring(0, 500) + '...'
                }
                callback(titleText)
            }
        });
    }
    catch (err) {
        console.log('urltitle:',err);
    }
};
