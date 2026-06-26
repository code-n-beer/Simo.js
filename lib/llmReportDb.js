const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.SIMO_LLM_REPORT_DB || '/simojs-data/simo-llm-reports.sqlite';

let db;

function initDatabase(database) {
    const createTable = `CREATE TABLE IF NOT EXISTS llm_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        channel TEXT,
        reporter TEXT,
        requester TEXT,
        command TEXT NOT NULL,
        input TEXT NOT NULL,
        output TEXT,
        system_prompt TEXT,
        context_json TEXT,
        context_turns INTEGER,
        model TEXT,
        params_json TEXT,
        label TEXT NOT NULL,
        reason TEXT,
        output_url TEXT,
        status TEXT DEFAULT 'new'
    )`;

    database.serialize(function() {
        database.run(createTable);
    });
}

db = new sqlite3.Database(DB_PATH, function(err) {
    if (err) {
        console.log('LlmReportDB:', 'could not open database file from:', DB_PATH);
        console.log('LlmReportDB:', 'using in-memory database instead');
        db = new sqlite3.Database(':memory:', function(memoryErr) {
            if (memoryErr) {
                console.log('LlmReportDB:', 'could not open in-memory database:', memoryErr);
                return;
            }
            initDatabase(db);
        });
        return;
    }

    console.log('LlmReportDB: persistent db opened');
    initDatabase(db);
});

function addReport(report, callback) {
    const insertRow = `INSERT INTO llm_reports (
        created_at,
        channel,
        reporter,
        requester,
        command,
        input,
        output,
        system_prompt,
        context_json,
        context_turns,
        model,
        params_json,
        label,
        reason,
        output_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(insertRow,
        report.created_at,
        report.channel,
        report.reporter,
        report.requester,
        report.command,
        report.input,
        report.output,
        report.system_prompt,
        report.context_json,
        report.context_turns,
        report.model,
        report.params_json,
        report.label,
        report.reason,
        report.output_url,
        function(err) {
            callback(err, this && this.lastID);
        }
    );
}

module.exports = {
    addReport
};
