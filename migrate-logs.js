const lemmatizerUrl = 'http://localhost:7689'
const axios = require('axios')
const sqlite3 = require('sqlite3').verbose(),

function LogDB(db) {
    var create_table = "CREATE TABLE IF NOT EXISTS logs \
                    (id integer primary key, \
                    timestamp datetime default current_timestamp, \
                    channel VARCHAR(40) NOT NULL, \
                    sender VARCHAR(40) NOT NULL, \
                    lemmatized_message VARCHAR(510) NULL, \
                    word_types VARCHAR(600) NULL, \
                    message VARCHAR(510) NULL)";

    db.serialize(function () {
        db.run(create_table);
    });

}

function lemmatize(message) {
    //console.log('attemping lemmatization')
    try {
        return axios.post(lemmatizerUrl, message, {
            headers: { 'Content-Type': 'text/plain' }
        }).then(response => {
            console.log('lemma results')
            //console.log(response.data)
            return response.data
            //words = response.data.split('\n').slice(4, -2).map(str => str.split('\t')[2]).join(' ')
            //types = response.data.split('\n').slice(4, -2).map(str => str.split('\t')[3]).join(' ')
            //console.log('words', words)
            //console.log('types', types)
            //return [words, types] 
        }).catch(error => console.log('errored ', error))
    }
    catch (err) {
        console.log("erroredest ", err)
        return Promise.resolve([null, null])
    }
}

const insertRowQuery = 'INSERT INTO logs \
                         (timestamp, channel, sender, message, lemmatized_message, word_types) \
                         VALUES (?, ?, ?, ?, ?, ?)'

function addQuery(timestamp, channel, sender, message, lemmatized_message, word_type, db, cb) {
    db.run(insertRowQuery, timestamp, channel, sender, message, lemmatized_message, word_type, (err) => {
        cb(err)
    })
}


module.exports = {
    addQuery
}
//curl --request POST --header 'Content-Type: text/plain; charset=utf-8' --data-binary "This is an example sentence, nothing more, nothing less." http://localhost:15000 > parsed.conllu


const db_old = new sqlite3.Database('./simojs-data/simojs-logs.sqlite', (err) => {
    if (err) {
        console.log('could not open database file:', err)
    }
})
const db_new = new sqlite3.Database('./simojs-data/simojs-logs-lemmatized.sqlite', (err) => {
    if (err) {
        console.log('could not open database file:', err)
    }
})
LogDB(db_old)
LogDB(db_new)

db_old.all('SELECT * FROM logs', async function (err, rows) {
    //messages = rows.slice(0, 40).map(row => row.message)
    messages = rows.map(row => row.message)
    joinedRows = messages.join('\n')
    //console.log()
    //const row = rows[idx]
    //console.log('processing ', idx, ' out of ', rows.length)
    //console.log(row.message)
    //await lemmatize(joinedRows).then(([lemmatizedMessage, wordTypes]) => {
    await lemmatize(joinedRows).then(results => {
        console.log('lemmatized')
        words = results.split('# text').slice(1).map(sentence => sentence.split('\n').slice(1, -2).filter(s => s.trim().length > 0).map(line => line.split('\t')[2]).join(' '))
        types = results.split('# text').slice(1).map(sentence => sentence.split('\n').slice(1, -2).filter(s => s.trim().length > 0).map(line => line.split('\t')[3]).join(' '))
        console.log('split')
        //console.log('words', words)
        //console.log('types', types)
        for (i in words) {
            console.log('adding to db ', i)
            row = rows[i]
            lemmatized = words[i]
            wordTypes = types[i]
            //console.log('row', row)
            //console.log('words', lemmatized)
            addQuery(row.timestamp, row.channel, row.sender, row.message, lemmatized, wordTypes, db_new, (err) => err ? console.log('err', err) : null)
        }
    })



})

//db_old.all('SELECT * FROM logs', async function (err, rows) {
//        for (idx in rows) {
//            const row = rows[idx]
//            console.log('processing ', idx, ' out of ', rows.length)
//            console.log(row.message)
//            await lemmatize(row.message).then(([lemmatizedMessage, wordTypes]) => {
//                addQuery(row.timestamp, row.channel, row.sender, row.message, lemmatizedMessage, wordTypes, db_new, (err) => err ? console.log('err', err) : null)
//            })
//        }
//
//
//
//})
