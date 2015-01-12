var request     = require('request')
  , _           = require('underscore')
  , moment      = require('moment')
  , util        = require('util')
  , S           = require('string')
  , async       = require('async')
  , restaurants = {updated_on:0}
  , menus       = [];

var unicafe = function(client, channel, from, line){
  this.say = function(msg) {
    client.say(channel, msg);
  }

  var args = _.rest(line.split(" "));
  if(_.isEmpty(args)) {
    args = ["Exactum", "Chemicum"];
  }
  
  args = _.map(args, function(str) { return S(str).capitalize().s });

  if(restaurants.updated_on < moment().subtract(1, 'week').unix()) {
    update_restaurants(_.partial(update_menus, args, _.bind(get_menus, this)));
  } else {
    update_menus(args, _.bind(get_menus, this));
  }
}

function update_restaurants(callback) {
  var url = 'http://hyy-lounastyokalu-production.herokuapp.com/publicapi/restaurants'
  request(url, function(err, res, body) {
    if(err) {
      util.log(module.exports.name, err);
      return;
    }
    if(res.statusCode != 200) {
      util.log(module.exports.name, 'invalid response:',res);
      return;
    }
    var result;
    try {
      result = JSON.parse(body);
    } catch (e) {
      util.log(module.exports.name, e);
      return;
    }
    restaurants.content = result.data;
    restaurants.updated_on = moment().unix();
    callback();
  });
}

var update_menus = function(names, callback) {
  var url = "http://hyy-lounastyokalu-production.herokuapp.com/publicapi/restaurant/"
  async.each(names, function(name, cb) {
    var id = _.find(restaurants.content,
      function(restaurant) { return restaurant.name == name }).id;

    if(menu_needs_update(id)) {
      request(url + id, function(err, res, body) {
        if(err) {
          util.log(module.exports.name, err);
          cb(err);
          return;
        }
        if(res.statusCode != 200) {
          util.log(module.exports.name, 'invalid response:',res);
          cb(res);
          return;
        }
        var result;
        try {
          result = JSON.parse(body);
        } catch (e) {
          util.log(module.exports.name, e);
          cb(e);
          return;
        }
        result.id = id;
        result.name = name;
        menus = _.reject(menus, function(menu) { return menu.id == id });
        menus.push(result);
        cb();
      });
    } else {
      cb();
    }
  }, function() {
    callback(names, print_menus);
  });
}

var get_menus = function(names, callback) {
  var result = new Array();
  async.each(names, function(name, cb) {
    var week_menu = _.find(menus, function(menu) { return menu.name == name });
    if(!week_menu) {
      return;
    }
    week_menu = week_menu.data;
    var day_menu = _.find(week_menu, function(day_menu) {
                  var menu_date = moment(day_menu.date_en, "DD.MM");
                  return menu_date.startOf('day').isSame(moment().startOf('day'))
                });
    day_menu = day_menu.data;
    day_menu.name = name;
    result.push(day_menu);
    cb();
  }, function() {
    callback(result, this.say);
  });
}

var print_menus = function(menus, say) {
  var result = new Array();
  async.each(menus, function(menu, cb) {
    var menu_str = menu.name + ": ";
    var menu_arr = _.map(menu, function(meal) {
      var meal_str = meal.name;
      if(meal.price.name == "Maukkaasti") {
        meal_str += " [M]";
      }
      return meal_str;
    });
    menu_str += menu_arr.join(" / ");
    result.push(menu_str);
    cb();
  }, function() {
    result = result.join(" // ");
    say(result);
  });


}

function menu_needs_update(id) {
  var week_menu = _.find(menus, function(menu) { return menu.id == id });
  if(!week_menu || !week_menu.data) {
    return true;
  }
  week_menu = week_menu.data;
  return _.every(week_menu, function(day_menu) {
           if(!day_menu.date_en) {
             return false;
           }
           var menu_date = moment(day_menu.date_en, "DD.MM");
           return !menu_date.startOf('day').isSame(moment().startOf('day'))
         });
}

var restaurantlist = function(client, channel, from, line) {
  var print_restaurantlist = function() {
    var result = 'Restaurants: ';
    result += _.pluck(restaurants.content, 'name').join(", ");
    client.say(channel, result);
  }
  if(restaurants.updated_on < moment().subtract(1, 'week').unix()) {
    update_restaurants(print_restaurantlist);
  } else {
    print_restaurantlist();
  }
}

module.exports = {
    name: "unicafe", //not required atm iirc 
    commands: { 
       "!unicafe": unicafe,
       "!unicafes": restaurantlist,
       "!restaurantlist": restaurantlist,
       "!ucs": restaurantlist,
       "!uc": unicafe,
    }
}
