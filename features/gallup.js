var onGoing = false;
var startedBy; //nick of user who started the gallup
var question = "";
var options = []; 
var answered = []; // list of users who have already answered the gallup (yes, you can circumvent it by changing your nick)

var gallup = function(client, channel, from, line)

	if (onGoing)
    {
        client.say(channel, question, printAnswers());
        return;
    }
	startedBy = from.replace("_", "");
    onGoing = true;
    var line = line.split('#');
    question = line[0].substring(8);
    options = line.slice(1).map(function(x) { return [ x : 0 ]; });
    client.say(channel, "Started gallup " + question + " " + printOptions());
    setTimeout(function() { end(client, channel); }, 60*60*12);

}

var answer = function(client, channel, from, line)

    if (!onGoing)
	{
		client.say(channel, "No ongoing gallup. Start a new one by saying !gallup #Ass or boobs? #Ass #Boobs #Neither, I like ice cream");
		return;
	}
	if (answered.indexOf(from.replace("_", "")) != -1)
    {
        client.say(channel, "You have already answered this gallup, " + from);
        return;
    }
	answered.append(from.replace("_", ""));
    var answer = line.substring(10);
    var accepted = false;
    if (isNan(answer)) //answer is text
    {
        for (var i = 0; i < options.length; i++)
        {
            if(answer.trim() === options[i][0])
            {
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
    if (accepted)
    {
        client.say(channel, "Answer recorded.");
    } else {
        client.say(channel, "Invalid answer. Question was " + question + " Options are " + printOptions())
    }

}

var endCheck = function(client, channel, from, line)
{
	if (!onGoing)
	{
		client.say(channel, "No ongoing gallup");
		return;
	} 
	if (from.replace("_", "") != startedBy) {
		client.say(channel, "You can't end this gallup because you didn't start it. Gallup was started by " + startedBy);
		return;
	}
	end(client, channel);
}

var end = function(client, channel)
{
	answered = [];
	options = [];
	question = "";	
    client.say(channel, "Gallup finished: " + question + " Results: " + printOptions(true));
	onGoing = false;
    //save results
}

module.exports = {
	name: gallup,
	commands: {
		"!gallup" : gallup,
		"!answerg" : answer,
		"!endgallup" : endCheck
	}
}
