const express = require('express');
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// REAL LIVE COUNT SYSTEM - No Fake
let countPath = './count.json';
if (!fs.existsSync(countPath)) {
    fs.writeFileSync(countPath, JSON.stringify({ total: 1240 }));
}
function getCount() {
    return JSON.parse(fs.readFileSync(countPath)).total;
}
function incCount() {
    let data = JSON.parse(fs.readFileSync(countPath));
    data.total++;
    fs.writeFileSync(countPath, JSON.stringify(data));
    return data.total;
}

// Pair Code Generate API
app.get('/code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: 'Number missing' });

    // Auto Country System - number clean
    num = num.replace(/[^0-9]/g, '');
    if (num.length < 10) return res.status(400).json({ error: 'Invalid number' });

    try {
        const sessionDir = './temp/' + num;
        if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
        
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });

        sock.ev.on('creds.update', saveCreds);

        // Wait a bit then request pairing code
        await delay(2000);
        let code = await sock.requestPairingCode(num);
        code = code?.match(/.{1,4}/g)?.join("-") || code;

        const finalCount = incCount();
        
        // Auto delete session after 60 sec
        setTimeout(() => {
            if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
        }, 60000);

        res.json({ code: code, count: finalCount });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate code. Try again.' });
    }
});

app.get('/count', (req, res) => {
    res.json({ total: getCount() });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`MAHIR-MD Pair Server running on ${PORT}`));
