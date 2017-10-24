var player1 = "";
var player2 = "";

var player1choice = undefined;
var player2choice = undefined;

var rps = ["rock", "paper", "scissors"];

var playing = false;

var play = function(client, channel, from, line) {
    if (playing) {
        client.say(channel, "Wait for your turn.");
        return;
    }
    player1 = from;
    player2 = line.split(" ")[1];
    if (!player2) {
        client.say(channel, "To play vs Simo, just use !rock !paper !scissors when no game is being played");
        return;
    }

    playing = true;

    var ret = player2 + ", " + player1 + " challenged you to a game of rock paper scissors, /msg your choice in 10 seconds! [!rock, !paper, !scissors]";
    client.say(channel, ret);
    setTimeout(function() {
        end(client, channel);
    }, 10000);
}

var reset = function() {
    playing = false;
    player1 = "";
    player2 = "";
    player1choice = undefined;
    player2choice = undefined;
}

var end = function(client, channel) {
    var fail = " failed to choose their weapon.";
    var tie = " chosen by both players, it's a tie.";
    if (player1choice === undefined) {
        client.say(channel, player1 + fail);
        reset();
        return;
    } else if (player2choice === undefined) {
        client.say(channel, player2 + fail);
        reset();
        return;
    }
    if (compare(player1choice, player2choice) === "tie") {
        client.say(channel, rps[player1choice] + tie);
        reset();
        return;
    } else if (compare(player1choice, player2choice) === "p1") {
        client.say(channel,
            player1 + " wins! " + rps[player1choice] + " beats " + rps[player2choice]);
        reset();
        return;
    } else if (compare(player1choice, player2choice) === "p2") {
        client.say(channel,
            player2 + " wins! " + rps[player2choice] + " beats " + rps[player1choice]);
        reset();
        return;
    }
}

var compare = function(choice1, choice2) {
    // return winner or tie
    var table = [
        ["tie", "p2", "p1"],
        ["p1", "tie", "p2"],
        ["p2", "p1", "tie"]
    ];
    return table[choice1][choice2];
}

var solo = function(client, channel, from, choice) {
    player1 = from;
    player1choice = choice;
    player2 = "Simo";
    player2choice = Math.floor(Math.random() * 3);
    end(client, channel);
}

var rock = function(client, channel, from, line) {
    if (!playing) {
        solo(client, channel, from, 0);
        return;
    }
    if (from === player1) {
        player1choice = 0;
    } else if (from === player2) {
        player2choice = 0;
    } else {
        return;
    }
}

var paper = function(client, channel, from, line) {
    if (!playing) {
        solo(client, channel, from, 1);
        return;
    }
    if (from === player1) {
        player1choice = 1;
    } else if (from === player2) {
        player2choice = 1;
    } else {
        return;
    }
}

var scissors = function(client, channel, from, line) {
    if (!playing) {
        solo(client, channel, from, 2);
        return;
    }
    if (from === player1) {
        player1choice = 2;
    } else if (from === player2) {
        player2choice = 2;
    } else {
        return;
    }
}

module.exports = {
    name: "rock paper scissors",
    commands: {
        "!rps": play,
        "!rock": rock,
        "!paper": paper,
        "!scissors": scissors,
    }
}