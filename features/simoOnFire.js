var Firebase = require("firebase");
var simoOnFire = new Firebase("https://simocmds.firebaseio.com");

var logActionToFireBase = function(from, to, message, commands) {

	if (message[0] === '!') {

      var wanhat = ["!expl", "!horos", "!lastfm", "!mötö", "!unmötö", "!niksi",
      "!r", "!uc", "!weather", "!uguu", "!add", "!remove", "!c", "!pizza", "!tweet"];

      var cmd = message.split(" ")[0];
      if (commands[cmd] !== undefined || wanhat.indexOf(cmd) !== -1) {
        function checkIfCmdInFirebase(input) {
          simoOnFire.child(input).on("value", function(val) {
            return (val.val() !== null);
          });
        }

        function createEntryToFirebase(comm) {
          var obj = {};
          obj[comm] = 1;
          simoOnFire.set(obj);
        }

        function updateEntryInFirebase(comm) {
          simoOnFire.child(comm).once("value", function(val) {
            var obj = {};
            obj[comm] = val.val()+1;
            simoOnFire.update(obj);
          });
        }

        if (checkIfCmdInFirebase(cmd)) {
          createEntryToFirebase(cmd);
        } else {
          updateEntryInFirebase(cmd);
        }
      }
    } 

}

module.exports = {
    name: "simoOnFire",//not required atm iirc 
    loggingAction: logActionToFireBase
}
