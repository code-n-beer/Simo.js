var onGoing = false,
    startedBy, //nick of user who started the gallup
    question = "",
    options = [],
    answered = []; // list of users who have already answered the gallup (yes, you can circumvent it by changing your nick)

var gallup = function(client, channel, from, line) {
    if (onGoing) {
        client.say(channel, question + " " + printOptions(false));
        return;
    }
    startedBy = from.replace("_", "");
    var line = line.split('#');
    question = line[0].substring(8);
    if (line.length < 2 || question.length == "") {
        client.say(channel, "Question not long enough or not enough options. Start a gallup by saying !gallup Ass or boobs? #Ass #Boobs #Neither, I like ice cream");
        return;
    }
    line.slice(1).map(function(x) {
        options.push([x.trim(), 0]);
    }); //convert list of options to array with space for counter of answers
    onGoing = true;
    client.say(channel, "Started gallup " + question + " " + printOptions(false));
    setTimeout(function() {
        end(client, channel);
    }, 1000 * 60 * 60 * 12);

}

var answer = function(client, channel, from, line) {
    if (!onGoing) {
        client.say(channel, "No ongoing gallup. Start a new one by saying !gallup Ass or boobs? #Ass #Boobs #Neither, I like ice cream");
        return;
    }
    if (answered.indexOf(from.replace("_", "")) != -1) {
        client.say(channel, "You have already answered this gallup, " + from);
        return;
    }
    var answer = line.substring(8);
    var accepted = false;
    answer = answer.trim();
    if (isNaN(answer)) //answer is text
    {
        for (var i = 0; i < options.length; i++) {
            if (answer.trim() === options[i][0]) {
                options[i][1] = options[i][1] + 1;
                accepted = true;
                break;
            }
        }
    } else if (answer < options.length) //answer is a number and in the range
    {
        accepted = true;
        options[answer][1] = options[answer][1] + 1;
    }

    if (accepted) {
        client.say(channel, "Answer recorded.");
        answered.push(from.replace("_", ""));
    } else {
        client.say(channel, "Invalid answer. Question was " + question + " Options are " + printOptions(false))
    }

}

var endCheck = function(client, channel, from, line) {
    if (!onGoing) {
        client.say(channel, "No ongoing gallup. Start a new one by saying !gallup Ass or boobs? #Ass #Boobs #Neither, I like ice cream");
        return;
    }
    if (from.replace("_", "") != startedBy) {
        client.say(channel, "You can't end this gallup because you didn't start it. Gallup was started by " + startedBy);
        return;
    }
    end(client, channel);
}

var end = function(client, channel) {
    client.say(channel, "Gallup finished: " + question + " Results: " + printOptions(true));
    answered = [];
    options = [];
    question = "";
    onGoing = false;
    //save results
}

var printOptions = function(results) {
    var ret = "";
    if (results) {
        var noOfAnswers = options.reduce(function(x, y) {
            return x + y[1];
        }, 0);
        if (noOfAnswers == 0) {
            return "No answers.";
        }
    }
    for (var i = 0; i < options.length; i++) {
        if (!results) ret += "(" + i + ") ";
        ret += options[i][0] + " ";
        if (results) {
            ret += ": " + options[i][1] + " answer" + options[i][1] == 1 ? "" : "s" + " (" + (parseFloat(options[i][1]) / noOfAnswers) * 100 + "%) ";
        }
    }
    return ret;
}

module.exports = {
    name: gallup,
    commands: {
        "!gallup": gallup,
        "!answerg": answer,
        "!endgallup": endCheck
    }
}