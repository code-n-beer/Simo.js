var request = require('request'),
    cheerio = require('cheerio'),
    imgs = /(.+)\.(gif|jpg|jpeg|gifv|webm|png)$/;

module.exports.UrlTitle = UrlTitle;

function UrlTitle() {}

UrlTitle.prototype.getTitle = function(str, callback) {

    // regex for url detection
    var re_weburl = new RegExp(
        "^" +
            // protocol identifier
        "(?:(?:https?)://)" +
            // user:pass authentication
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:" +
            // IP address exclusion
            // private & local networks
        "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
        "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
        "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
            // IP address dotted notation octets
            // excludes loopback network 0.0.0.0
            // excludes reserved space >= 224.0.0.0
            // excludes network & broacast addresses
            // (first & last IP address of each class)
        "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
        "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
        "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
        "|" +
            // host name
        "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
            // domain name
        "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
            // TLD identifier
        "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
        ")" +
            // port number
        "(?::\\d{2,5})?" +
            // resource path
        "(?:/\\S*)?" +
        "$", "i"
    );

    var url = String(str.match(re_weburl));

    var imgurImg = imgs.exec(url);
    if(url.indexOf('imgur') != -1 && imgurImg) {
        url = imgurImg[1];
    }

    try {
        request(String(url), function (error, response, body) {
            var $ = cheerio.load(body);
            var titleText = $('title').text();
            if (titleText) {
                titleText = titleText.trim();
                if (titleText.indexOf('\n') > -1) {
                    titleText = titleText.substring(0, titleText.indexOf('\n'));
                }
                if (titleText.length > 100) {
                    titleText = titleText.substring(0, 200) + '...'
                }
                callback(titleText)
            }
        });
    }
    catch (err) {
        console.log('urltitle:',err);
    }
};
