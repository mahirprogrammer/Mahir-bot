const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;
let sock = null;
let lastQR = null;
let isPaired = false;

function getMyPhoto() {
    const folders = ['./img', './image'];
    for (let folder of folders) {
        if (fs.existsSync(folder)) {
            let files = fs.readdirSync(folder).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp'));
            if (files.length > 0) return path.join(folder, files[0]);
        }
    }
    return null;
}

// ============ PROGRAMMER MAHIR - CURRENT THEME (PURPLE + ELECTRIC) ============
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>PROGRAMMER MAHIR</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',sans-serif}
body{background:#080514;color:#fff;min-height:100vh;display:flex;justify-content:center;padding:10px;overflow-x:hidden}
.card{background:linear-gradient(180deg, rgba(25,16,52,0.98), rgba(18,12,38,0.98));border:1.5px solid #a855f766;border-radius:24px;padding:20px;width:100%;max-width:420px;text-align:center;box-shadow:0 0 30px #a855f722;height:fit-content}
.top-badges{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}
.badge{border:1px solid #ffffff22;background:#15102a;padding:6px 12px;border-radius:99px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:5px}
.badge.green{border-color:#22c55e55;color:#86efac}
.badge.purple{border-color:#a855f755;color:#e9d5ff}
.electric-wrap{width:86px;height:86px;margin:12px auto;border-radius:50%;background:radial-gradient(circle, #2a1a5a 0%, #15102a 70%);border:2px solid #a855f7;box-shadow:0 0 25px #a855f799, inset 0 0 20px #a855f722;display:flex;align-items:center;justify-content:center;cursor:pointer;animation: pulse 2s infinite}
.electric-wrap:active{transform:scale(0.95)}
@keyframes pulse{0%,100%{box-shadow:0 0 20px #a855f799}50%{box-shadow:0 0 35px #a855f7cc}}
.electric{font-size:42px;filter: drop-shadow(0 0 8px #e879f9)}
.logo{font-weight:900;font-size:24px;letter-spacing:1px;margin:8px 0 2px}
.logo.p1{color:#fff}.logo.p2{color:#c084fc}
.sub{font-size:11px;color:#a78bfa;letter-spacing:2px;margin-bottom:14px}
input{width:100%;padding:14px;margin:10px 0;border-radius:14px;border:1.5px solid #a855f766;background:#0f0b1f;color:#fff;font-size:15px;text-align:center;outline:none}
button.main{width:100%;padding:14px;background:linear-gradient(90deg,#7c3aed,#a855f7,#ec4899);border:none;border-radius:14px;font-size:14px;font-weight:900;cursor:pointer;margin:6px 0;color:#fff;box-shadow:0 4px 18px #a855f766;letter-spacing:0.5px}
#pairBox{margin-top:14px;font-size:26px;letter-spacing:4px;color:#67e8f9;font-weight:900;background:#0f0b1f;padding:16px;border-radius:14px;display:none;border:1.5px dashed #e879f9;font-family:monospace;word-break:break-all}
#qrBox{margin-top:16px;background:#fff;padding:14px;border-radius:18px;display:none;cursor:pointer}
#qrBox img{width:100%;max-width:320px;display:block;margin:0 auto;border-radius:10px}
.status{margin-top:12px;color:#86efac;font-size:11px;font-weight:800;background:#0f1a12;padding:8px;border-radius:99px;display:inline-block;border:1px solid #22c55e33}
.quick{text-align:left;background:#0f0b1f;border:1px solid #ffffff11;border-radius:14px;padding:12px;margin-top:14px}
.quick b{color:#e879f9;font-size:11px}
.quick div{font-size:10.5px;color:#9ca3af;line-height:1.7;margin-top:4px}
.footer{font-size:9px;color:#475569;margin-top:12px;letter-spacing:1px}
</style></head><body>
<div class="card">
<div class="top-badges">
<div class="badge green">🟢 Server 1 • Active</div>
<div class="badge purple">⚡ Quick Setup</div>
</div>

<div class="electric-wrap" onclick="getCode()" title="Click for Current Flow">
<div class="electric">⚡</div>
</div>

<div class="logo"><span class="p1">PROGRAMMER</span> <span class="p2">MAHIR</span></div>
<div class="sub">CURRENT FLOW SYSTEM</div>

<input id="number" placeholder="8801XXXXXXXXX (no +)" />
<button class="main" onclick="getCode()">⚡ GET PAIR CODE AND QR CODE</button>

<div id="pairBox" onclick="this.style.display='none'"></div>
<div id="qrBox" onclick="document.getElementById('pairBox').style.display='block'">
<p style="color:#000;font-weight:900;font-size:12px;margin-bottom:8px">FULL QR CODE - CLICK TO VIEW PAIR</p>
<img id="qrImg" src="" />
<p style="color:#6b7280;font-size:10px;margin-top:8px">WhatsApp > Linked Devices > Link a Device<br><span style="color:#a855f7;font-weight:700">QR এ ক্লিক করলে Pair Code দেখবে</span></p>
</div>

<div id="status" class="status">Starting...</div>

<div class="quick">
<b>⚡ QUICK SETUP:</b>
<div>
1. Number: 8801xxx (+ ছাড়া)<br>
2. Button / Electric Symbol এ Click করো<br>
3. Pair Code আলাদা, Full QR আলাদা আসবে<br>
4. Code 20 sec এর ভিতরে বসাও - Fast 3-5 sec Login<br>
5. Pair আটকালে Full QR Scan করো
</div>
</div>

<div class="footer">2026 @2026 PROGRAMMER MAHIR - POWERED BY MAHIR • CURRENT FLOW</div>
</div>

<script>
async function check(){
 try{
  let r=await fetch('/status'); let j=await r.json();
  document.getElementById('status').innerText='Bot Status: '+j.status;
  if(j.qr){ document.getElementById('qrBox').style.display='block'; document.getElementById('qrImg').src=j.qr; }
 }catch(e){}
}
setInterval(check,2500); check();
async function getCode(){
 let num=document.getElementById('number').value.replace(/[^0-9]/g,'');
 if(num.length<11)return alert('8801XXXXXXXXX লিখো, + ছাড়া');
 let box=document.getElementById('pairBox'); box.style.display='block'; box.innerText='Generating FAST Current...';
 try{
  let res=await fetch('/pair?number='+num); let data=await res.json();
  if(data.code){ box.innerText=data.code; box.style.display='block'; }
  else { box.innerText=data.error||'Error'; }
 }catch(e){ box.innerText='Server Busy, 5 sec por try'; }
}
</script></body></html>
`);
});

app.get('/status', async (req, res) => {
  let qrData = null;
  if(lastQR){ try{ qrData = await QRCode.toDataURL(lastQR, {width:900, margin:1}); }catch(e){} }
  res.json({ status: isPaired? 'Connected ✅ Online' : (lastQR? 'Scan Full QR or Use Pair Code' : 'Waiting for Current...'), qr: qrData });
});

app.get('/pair', async (req, res) => {
  let number = req.query.number?.replace(/[^0-9]/g,'');
  if(!number) return res.json({ error: 'Number dao' });
  if(!sock) return res.json({ error: 'Bot starting, 10 sec por try koro' });
  try{
    let code = await sock.requestPairingCode(number);
    code = code.match(/.{1,4}/g)?.join("-") || code;
    res.json({ code });
  }catch(e){ res.json({ error: 'Failed: '+e.message }); }
});

app.listen(PORT, ()=>console.log('MAHIR CURRENT LIVE '+PORT));

// ============ BOT LOGIC - FAST + PHOTO REPLY ============
let pendingAdd = {}, pendingAddGid = {}, pendingDownload = {};

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    sock = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })) },
        logger: P({ level: 'silent' }),
        browser: ['Mahir Bot', 'Chrome', '1.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect, qr } = u;
        if(qr){ lastQR = qr; console.log('New Full QR'); }
        if(connection==='open'){ isPaired=true; lastQR=null; console.log('BOT CONNECTED FAST'); }
        if(connection==='close'){
            isPaired=false;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut;
            if(shouldReconnect) setTimeout(startBot, 3000);
            else { if(fs.existsSync('./auth')) fs.rmSync('./auth',{recursive:true,force:true}); setTimeout(startBot, 3000); }
        }
    });

    const fullMenu = `╭───『 *MAHIR BOT* 』───\n│\n├─ *GROUP*\n│ •.kick @user\n│ •.promote @user\n│ •.demote @user\n│ •.group open / close\n│ •.tagall [msg]\n│ •.add\n│\n├─ *DOWNLOADER*\n│ •.yt /.fb /.tiktok /.ig\n│ •.download [link]\n│\n├─ *BROADCAST*\n│ •.broadcast [msg]\n│ •.bcgc [msg]\n│\n├─ *BOT*\n│ • hi /.menu\n╰─────────────────`;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]; if(!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid; const isGroup = from.endsWith('@g.us');
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "").trim();
        const sender = m.key.participant || from; const lower = text.toLowerCase();

        if(['hi','hello','salam','menu','.menu','bot','mahir'].includes(lower)){
            const photo = getMyPhoto();
            try{ if(photo) await sock.sendMessage(from,{image:fs.readFileSync(photo),caption:fullMenu},{quoted:m}); else await sock.sendMessage(from,{text:fullMenu},{quoted:m}); }catch{ await sock.sendMessage(from,{text:fullMenu},{quoted:m}); } return;
        }
        if(text.startsWith('.kick') && isGroup){ const mentioned=m.message.extendedTextMessage?.contextInfo?.mentionedJid; if(mentioned) await sock.groupParticipantsUpdate(from,mentioned,'remove'); }
        if(text.startsWith('.promote') && isGroup){ const mentioned=m.message.extendedTextMessage?.contextInfo?.mentionedJid; if(mentioned) await sock.groupParticipantsUpdate(from,mentioned,'promote'); }
        if(text.startsWith('.demote') && isGroup){ const mentioned=m.message.extendedTextMessage?.contextInfo?.mentionedJid; if(mentioned) await sock.groupParticipantsUpdate(from,mentioned,'demote'); }
        if(text==='.group close' && isGroup) await sock.groupSettingUpdate(from,'announcement');
        if(text==='.group open' && isGroup) await sock.groupSettingUpdate(from,'not_announcement');
        if(text.startsWith('.tagall') && isGroup){ const meta=await sock.groupMetadata(from); const members=meta.participants.map(p=>p.id); const msg=text.replace('.tagall','').trim()||'Attention!'; await sock.sendMessage(from,{text:msg,mentions:members},{quoted:m}); }
        if(text.startsWith('.broadcast')||text.startsWith('.bcgc')){ const msg=text.replace('.broadcast','').replace('.bcgc','').trim(); if(!msg) return; const allGroups=await sock.groupFetchAllParticipating(); for(let id of Object.keys(allGroups)) await sock.sendMessage(id,{text:`*📢 BROADCAST:*\n\n${msg}`}); await sock.sendMessage(from,{text:`✅ Sent to ${Object.keys(allGroups).length} groups`}); }
        if(lower==='.add'){ const allGroups=await sock.groupFetchAllParticipating(); const list=Object.values(allGroups); let msg='*Select Group:*\n\n'; list.forEach((g,i)=>msg+=`*${i+1}.* ${g.subject}\n`); msg+='\nReply:.select 1'; pendingAdd[sender]=list; await sock.sendMessage(from,{text:msg},{quoted:m}); }
        if(text.startsWith('.select ')){ const num=parseInt(text.split(' ')[1])-1; const list=pendingAdd[sender]; if(!list||!list[num]) return; pendingAddGid[sender]=list[num].id; await sock.sendMessage(from,{text:`*Selected:* ${list[num].subject}\n\nNow send:\n.add\n8801xxxx`},{quoted:m}); }
        if(text.startsWith('.add\n')){ const groupId=pendingAddGid[sender]; if(!groupId) return; let numbers=text.replace('.add','').trim().split(/[\n, ]+/).filter(n=>n.length>=11); let jids=numbers.map(n=>n.replace(/[^0-9]/g,'')+'@s.whatsapp.net').slice(0,20); try{ await sock.groupParticipantsUpdate(groupId,jids,'add'); await sock.sendMessage(from,{text:`✅ Added ${jids.length} members!`}); }catch(e){ await sock.sendMessage(from,{text:`Failed! Bot admin koro.`}); } }
        if(text.startsWith('.yt ')||lower==='.yt'){ if(text.split(' ').length===1){ pendingDownload[sender]='yt'; return sock.sendMessage(from,{text:'*YouTube Downloader*\n\nSend link now'},{quoted:m}); } await handleDownload(sock,from,m,text.split(' ')[1]); }
        if(text.startsWith('.fb ')||text.startsWith('.tiktok ')||text.startsWith('.ig ')||text.startsWith('.download ')){ await handleDownload(sock,from,m,text.split(' ')[1]); }
        if((text.includes('youtu')||text.includes('facebook')||text.includes('tiktok')||text.includes('instagram'))&&pendingDownload[sender]){ await handleDownload(sock,from,m,text); delete pendingDownload[sender]; }
    });
    async function handleDownload(sock,from,m,url){ try{ await sock.sendMessage(from,{text:'⏳ Downloading... '+url},{quoted:m}); let apiUrl=`https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`; if(url.includes('tiktok')) apiUrl=`https://api.akuari.my.id/downloader/tiktok?link=${encodeURIComponent(url)}`; if(url.includes('fb')||url.includes('facebook')) apiUrl=`https://api.akuari.my.id/downloader/fb?link=${encodeURIComponent(url)}`; if(url.includes('instagram')) apiUrl=`https://api.akuari.my.id/downloader/ig?link=${encodeURIComponent(url)}`; const res=await axios.get(apiUrl); let videoUrl=res.data?.respon?.url||res.data?.respon?.link||res.data?.result?.url||res.data?.url||null; if(videoUrl) await sock.sendMessage(from,{video:{url:videoUrl},caption:`✅ Downloaded by Mahir Bot`},{quoted:m}); else await sock.sendMessage(from,{text:`Link: ${url}`},{quoted:m}); }catch(e){ await sock.sendMessage(from,{text:`❌ Failed`},{quoted:m}); } }
}
startBot();
