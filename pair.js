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

// তোমার folder অনুযায়ী
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

// --- REAL COUNT FIX 100% ---
const countFile = path.join(__dirname, 'count.json');
if (!fs.existsSync(countFile)) {
  fs.writeFileSync(countFile, JSON.stringify({ total: 1247 }));
  console.log('count.json Auto Created');
}
const getCount = () => {
  try { return JSON.parse(fs.readFileSync(countFile, 'utf8')).total; } catch { return 1247; }
}
const incCount = () => {
  let t = getCount() + 1;
  fs.writeFileSync(countFile, JSON.stringify({ total: t }));
  return t;
}

app.get('/count', (req,res)=>{
  const total = getCount();
  res.json({ total, active: `${(total % 50) + 1}/50` });
});

app.get('/code', async (req,res)=>{
  let num = (req.query.number||'').replace(/[^0-9]/g,'');
  if(num.length < 10) return res.status(400).json({error:'Valid number দাও ভাই'});
  
  const dir = path.join(__dirname, 'temp', num);
  if(fs.existsSync(dir)) fs.rmSync(dir, {recursive:true, force:true});
  if(!fs.existsSync(path.join(__dirname,'temp'))) fs.mkdirSync(path.join(__dirname,'temp'),{recursive:true});

  try{
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
      logger: pino({level:'silent'}),
      browser: ["Ubuntu","Chrome","20.0.04"]
    });
    sock.ev.on('creds.update', saveCreds);
    await delay(3000);
    let code = await sock.requestPairingCode(num);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    const qr = await QRCode.toDataURL(code, { width: 300 });
    const total = incCount(); // Real count বাড়বে
    setTimeout(()=>{ if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true}) }, 65000);
    res.json({ code, qr, total });
  }catch(e){
    console.log(e.message);
    if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
    res.status(500).json({error:'Failed! 1 min পর try করো'});
  }
});

app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, ()=> console.log(`MAHIR RUNNING ON ${PORT} - Real Count Active`));
