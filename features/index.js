var files = [];
var commands = {};
require("fs").readdirSync("./features/").forEach(function(file) {
      if(file !== 'index.js'){
          console.log("file: " + file);
          files.push(file);
          var feature = require("./" + file.substring(0,file.length-3));
          for(var command in feature.commands){
              if(feature.commands.hasOwnProperty(command))
              {
                commands[command] = feature.commands[command]; 
             }
          }
      }
});

module.exports.enabledFeatures = {
    files: files,
    commands: commands
}
