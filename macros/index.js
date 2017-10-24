var macros = {};
require("fs").readdirSync("./features/").forEach(function(file) {
    if (file !== 'index.js') {
        console.log("file: " + file);
        files.push(file);
        var fileMacros = require("./" + file.substring(0, file.length - 3));

        for (var macro in fileMacros) {
            if (fileMacros.hasOwnProperty(macro)) {
                macros[macro] = fileMacros[macro];
                console.log('%s --> %s', macro, macros[macro]);
            }
        }
    }
});

module.exports = {
    macros: macros
}