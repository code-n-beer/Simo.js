const axios = require('axios')
const lemmatizerUrl = 'http://lemmatizer:7689'

const sqlite3 = require('sqlite3').verbose(),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    moment = require('moment'),
    async = require('async');

var db = new sqlite3.Database('/simojs-data/simojs-logs-lemmatized.sqlite', function(err) {
    if (err) {
        console.log('LogDB:', 'could not open database file from: /simojs-data/simojs-logs.sqlite');
        console.log('Using in-memory database instead');
        return new sqlite3.Database(':memory:');
    } else {
        console.log("LogDB: persistent db opened")
    }
});

function LogDB() {
    var create_table = "CREATE TABLE IF NOT EXISTS logs \
                    (id integer primary key, \
                    timestamp datetime default current_timestamp, \
                    channel VARCHAR(40) NOT NULL, \
                    sender VARCHAR(40) NOT NULL, \
                    lemmatized_message VARCHAR(510) NULL, \
                    word_types VARCHAR(600) NULL, \
                    message VARCHAR(510) NULL)";

    db.serialize(function() {
        db.run(create_table);
    });

}

function lemmatize(message) {
    console.log('attemping lemmatization')
    try {
        return axios.post(lemmatizerUrl, message, {
            headers: { 'Content-Type': 'text/plain' }
          }).then(response => {
            console.log('lemma results')
            result = response.data.split('\n').slice(4, -2).map(str => str.split('\t')[2]).join(' ')
            types = response.data.split('\n').slice(4, -2).map(str => str.split('\t')[3]).join(' ')
            console.log(result)
            return [result, types]
        }).catch(error => console.log('errored ', error))
    }
    catch(err) {
        console.log("erroredest ", err)
        return Promise.resolve(null)
    }
}

const insertRowQuery = 'INSERT INTO logs \
                         (channel, sender, message, lemmatized_message, word_types) \
                         VALUES (?, ?, ?, ?, ?)'

function addQuery(channel, sender, message, cb) {
  lemmatize(message).then(([lemmaResult, wordTypes]) => {
    db.run(insertRowQuery, channel, sender, message, lemmaResult, wordTypes, (err) => {
        cb(err)
    })
  })
}

LogDB()


module.exports = {
    addQuery
}
//curl --request POST --header 'Content-Type: text/plain; charset=utf-8' --data-binary "This is an example sentence, nothing more, nothing less." http://localhost:15000 > parsed.conllu