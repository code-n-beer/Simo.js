
module.exports = function(line1, wholecmd) {
    line1 = remove_newlines(line1);
    if(!wholecmd) return line1;

    line2 = wholecmd.split(" ").slice(1).join(" ");
    if(line2.length == 0) return line1;

    line2 = remove_newlines(line2);
    line1_arr = line1.split(" ");
    line2_arr = line2.split(" ");

    // concatenate on matching words
    for(var i = line1_arr.length; i >= 0; i--) {
        var match = line2_arr.indexOf(line1_arr[i]);
        if(match < 0) continue;
        return line1_arr.slice(0, i).concat(line2_arr.slice(match)).join(" ");
    }

    // concatenate on end of sentence
    var end_of_sentence = line1.indexOf(".");
    if(end_of_sentence < 0) return line1 + " " + line2;
    return line1.slice(0, end_of_sentence + 1) + " " + line2;
}

function remove_newlines(str) {
    return str.replace(/(\r\n|\n|\r)/gm,"");
}
