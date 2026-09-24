const express = require('express');
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// LIVE SYSTEM - Real file based
const countFile = path.join(__dirname, 'count.json');
if (!fs.existsSync(countFile)) fs.writeFileSync(countFile, JSON.stringify({ total: 1247 }));
const getCount = () => JSON.parse(fs.readFileSync(countFile)).total;
const incCount = () => {
    let d = JSON.parse(fs.readFileSync(countFile));
    d.total++;
    fs.writeFileSync(countFile, JSON.stringify(d));
    return d.total;
};

app.get('/count', (req,res) => {
    const total = getCount();
    const active = (total % 50) + 1;
    res.json({ total, active: `${active}/50` });
});

app.get('/code', async (req,res) => {
    let num = (req.query.number || '').replace(/[^0-9]/g,'');
    if (!num) return res.status(400).json({ error: 'Number missing' });

    const sessionDir = path.join(__dirname, 'temp', num);
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        let qrData = null;

        const sock = makeWASocket({
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
            logger: pino({ level: 'silent' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });
        sock.ev.on('creds.update', saveCreds);

        await delay(3000);
        let code = await sock.requestPairingCode(num);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        
        // Generate QR for pairing code
        const qrImage = await QRCode.toDataURL(code);

        const total = incCount();
        const active = (total % 50) + 1;

        setTimeout(()=>{ if(fs.existsSync(sessionDir)) fs.rmSync(sessionDir,{recursive:true,force:true}) }, 65000);

        res.json({ code, qr: qrImage, total, active: `${active}/50` });
    } catch(e) {
        console.log(e);
        if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true });
        res.status(500).json({ error: 'Failed! 1 min por abar try koro' });
    }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'index.html')));
app.listen(PORT, ()=> console.log(`PROGRAMMER MAHIR running on ${PORT}`));
