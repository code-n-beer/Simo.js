var request = require('request')
, qs = require('querystring')
, parseXML = require('xml2js').parseString
, _ = require('underscore')
, fs = require('fs')
, settings = JSON.parse(fs.readFileSync('./settings.json'))
, auth_data = {
  grant_type: settings.translator.grant_type,
  client_id: settings.translator.client_id,
  client_secret: settings.translator.client_secret,
  scope: settings.translator.scope
};

var auth_token;
var auth_expires = 0;
var langs = ['ar','bg','ca','zh-CHS','zh-CHT','cs','da','nl','en','et','fi',
  'fr','de','el','ht','he','hi','mww','hu','id','it','ja','tlh','tlh-Qaak',
  'ko','lv','lt','ms','mt','no','fa','pl','pt','ro','ru','sk','sl','es','sv',
  'th','tr','uk','ur','vi','cy'];

var translate = function(client, channel, from, line) {
  var say = function(msg) {
    try {
      client.say(channel, msg);
    } catch (ex) { console.log(ex) }
  };

  var line_array = line.split(" ");
  var lang = line_array[1];
  if(!lang) {
    say('available languages: ' + langs.join(', '));
    return;
  }

  var to = 'fi';
  if(_.indexOf(langs, lang) > -1) {
    to = lang;
    line_array = _.rest(line_array);
  }
  var translate_me = {
    text: _.rest(line_array).join(" "),
    to: to
  };

  var now = new Date(new Date().getTime() - 2000);
  if(!auth_token || now > auth_expires) {
    console.log(module.exports.name, 'authenticating');
    get_auth(say, get_translation, translate_me);
  } else {
    get_translation(say, translate_me);
  }
}

var get_auth = function(say, callback, translate_me) {

  var post_data = qs.stringify(auth_data);
  var url = "https://datamarket.accesscontrol.windows.net/v2/OAuth2-13";

  request.post({url:url, body:post_data}, function(e, r, body) {
    if(e) {
      console.log(module.exports.name, e);
      say('auth failed: request failed');
      return;
    }
    try {
      auth_json = JSON.parse(body);
      auth_token = auth_json.access_token;
      auth_expires = new Date(new Date().getTime() + auth_json.expires_in*1000);
    } catch(ex) {
      console.log(module.exports.name, auth_token);
      console.log(module.exports.name, auth_expires);
      say('auth failed: invalid response');
      return;
    }
    callback(say, translate_me);
  });
};

var get_translation = function(say, translate_me) {

  var options = {
    url: "http://api.microsofttranslator.com/v2/Http.svc/Translate?",
    qs: translate_me,
    headers: {
      'Authorization': 'Bearer ' + auth_token
    }
  };

  request(options, function(e, r, body) {
    if(e) {
      console.log(module.exports.name, e);
      say('translation failed: request failed');
      return;
    }
    // wtf is this microsoft shit, I just want the fucking translation
    parseXML(body, function(e, result) {
      if(e || !result.string._) {
        console.log(module.exports.name, e);
        say('translation failed: invalid response');
        return;
      }
      say(result.string._);
    });
  });

};
module.exports = {
  name: "translate", //not required atm iirc 
  commands: { 
    "!tr": translate,
    "!translate": translate
  }
}
