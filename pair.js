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
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

app.get('/code', async (req, res) => {
  let num = (req.query.number || '').replace(/[^0-9]/g, '');
  if (num.length < 10) return res.status(400).json({ error: 'Valid Number দাও ভাই' });

  const dir = path.join(__dirname, 'temp', num);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
      logger: pino({ level: 'silent' }),
      browser: ["Ubuntu", "Chrome", "20.0.04"]
    });
    sock.ev.on('creds.update', saveCreds);
    await delay(3000);
    let code = await sock.requestPairingCode(num);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    const qr = await QRCode.toDataURL(code, { width: 400 });
    
    setTimeout(() => { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); }, 70000);
    res.json({ code, qr });
  } catch (e) {
    console.log(e.message);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    res.status(500).json({ error: 'Failed, 1 min পর আবার Try করো' });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`MAHIR PAIR LIVE ON ${PORT}`));
