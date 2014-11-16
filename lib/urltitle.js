var request = require('request')
  , qs = require('querystring')
  , _ = require('underscore')
  , imgs = /(.+)\.(gif|jpg|jpeg|gifv|webm|png)$/
  , S = require('string')
  , htmlparser = require('htmlparser2');

  module.exports.UrlTitle = UrlTitle;

  function UrlTitle() {
  }

UrlTitle.prototype.getTitle = function(str, callback) {
  var parser = new htmlparser.Parser({
    listen: false,
    onopentag: function(name, attribs){
      if(name === "title"){
        this.listen = true;
      }
    },
    ontext: function(text){
      if(this.listen) {
        text = S(text).unescapeHTML().trim().s;
        callback(text);
      }
    },
    onclosetag: function(name){
      if(name === "title"){
        this.listen = false;
      }
    }
  });
  var strArr = str.split(" ");
  var url = _.find(strArr, hasUrl);
  if(!url) {
    return;
  }
  if(url.indexOf('http') != 0) {
    url = "http://" + url;
  }
  var imgurImg = imgs.exec(url);
  if(url.indexOf('imgur') != -1 && imgurImg) {
    url = imgurImg[1]; 
  }
  try {
    request(url, function(err, res, body) {
      if(!err &&
         res.statusCode == 200 &&
         S(res.headers['content-type']).startsWith('text'))
      {
        parser.write(body);
        parser.end();
      }
    });
  }
  catch (err) {
    console.log('urltitle:',err);
  }
};

function hasUrl(str) {
  return str &&
         (str.indexOf("www") != -1 ||
          str.indexOf("http") != -1)
}
