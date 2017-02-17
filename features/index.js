var files = [];
var inits = [];
var commands = {};
var regexes = {};
require("fs").readdirSync("./features/").forEach(function(file) {
      if(file !== 'index.js' && file.indexOf('.') !== 0){
          console.log("file: " + file);
          files.push(file);
          var feature = require("./" + file.substring(0,file.length-3));
          if(feature.init) {
              inits.push(feature.init);
          }

          for(var command in feature.commands){
              //if(feature.commands.hasOwnProperty(command))
              //{
                  if(commands.hasOwnProperty(command))
                  {
                      commands[command].push(feature.commands[command]);
                  }
                  else
                  {
                      commands[command] = [feature.commands[command]];
                  }
                  //commands[command] = feature.commands[command]; 
             //}
          }
          //console.log(commands);
          for( var regex in feature.regexes) {

              if(feature.regexes.hasOwnProperty(regex))
              {
                  if(regexes.hasOwnProperty(regex))
                  {
                      regexes[regex].push(feature.regexes[regex]);
                  }
                  else
                  {
                      regexes[regex] = [feature.regexes[regex]];
                  }
                  //regexes[regex] = feature.regexes[regex];
              }
          }
      }
});

module.exports.enabledFeatures = {
    files: files,
    commands: commands,
    inits: inits,
    regexes: regexes,
}
