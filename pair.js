const express = require('express');
const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.use('/img', express.static(path.join(__dirname,'img')));

const PORT = process.env.PORT || 10000;

// ====== PAIR CODE - Real ======
app.get('/code', async (req,res)=>{
  let num = (req.query.number||'').replace(/[^0-9]/g,'');
  if(num.length < 10) return res.json({error:'Valid number দাও'});

  const id = 'pair-'+Date.now();
  const dir = path.join(__dirname,'temp',id);
  fs.mkdirSync(dir,{recursive:true});

  try{
    const {state,saveCreds} = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:'silent'}))},
      logger:pino({level:'silent'}),
      printQRInTerminal:false,
      browser:["Ubuntu","Chrome","20.0.04"]
    });
    sock.ev.on('creds.update',saveCreds);
    await delay(3500);
    let code = await sock.requestPairingCode(num);
    code = code.match(/.{1,4}/g).join("-");
    
    // 3 min পর auto delete, যেন Couldn't link না আসে
    setTimeout(()=>{ if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true}); }, 180000);
    
    res.json({code});
  }catch(e){
    console.log(e);
    if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
    res.json({error:'Failed, Number এ WhatsApp আছে কিনা Check করো'});
  }
});

// ====== REAL QR CODE - Full Size & Working ======
app.get('/qr', async (req,res)=>{
  const id = 'qr-'+Date.now();
  const dir = path.join(__dirname,'temp',id);
  fs.mkdirSync(dir,{recursive:true});

  try{
    const {state,saveCreds} = await useMultiFileAuthState(dir);
    const sock = makeWASocket({
      auth:{creds:state.creds,keys:makeCacheableSignalKeyStore(state.keys,pino({level:'silent'}))},
      logger:pino({level:'silent'}),
      printQRInTerminal:false,
      browser:["Ubuntu","Chrome","20.0.04"]
    });
    sock.ev.on('creds.update',saveCreds);

    sock.ev.on('connection.update', async (u)=>{
      const {qr, connection} = u;
      if(qr){
        // Real WhatsApp QR, এটা Scan করলে 100% Link হবে
        const qrImg = await QRCode.toDataURL(qr, {width: 800, margin: 1});
        if(!res.headersSent){
          res.json({qr: qrImg});
        }
      }
      if(connection === 'open'){
        console.log('QR Paired Success');
        setTimeout(()=>{ if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true}); }, 5000);
      }
      if(connection === 'close'){
        setTimeout(()=>{ if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true}); }, 10000);
      }
    });

  }catch(e){
    if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
    res.json({error:'QR Failed'});
  }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT, ()=> console.log('MAHIR LIVE '+PORT));
