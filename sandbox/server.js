const express = require('express');
const SandCastle = require('sandcastle').SandCastle;
const path = require('path');

const app = express();
app.use(express.json());

const sbox = new SandCastle({
    api: path.join(__dirname, 'api.js'),
    memoryLimitMB: 128,
    timeout: 10000,
});

app.post('/run', (req, res) => {
    const { code, arg } = req.body;
    const script = sbox.createScript('exports.main = function() {' + code + '}');
    let settled = false;
    const settle = (data) => {
        if (!settled) {
            settled = true;
            res.json(data);
        }
    };

    script.on('exit', (err, output) => {
        if (err) {
            settle({ error: err.toString() });
        } else {
            settle({ result: output });
        }
    });

    script.on('timeout', () => {
        settle({ error: 'script timed out' });
    });

    script.run({ arg: arg || '' });
});

app.listen(3456, () => console.log('sandbox service listening on :3456'));
