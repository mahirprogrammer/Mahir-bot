const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
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

// ============ WEBSITE WITH PAIR CODE + QR CODE ============
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Mahir Bot</title>
<style>
body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;justify-content:center;padding:20px;margin:0}
.card{background:#111;padding:25px;border-radius:20px;width:100%;max-width:420px;text-align:center;border:2px solid #00ff88;box-shadow:0 0 25px #00ff8855}
input{width:90%;padding:13px;margin:10px 0;border-radius:10px;border:none;font-size:16px;text-align:center}
button{width:95%;padding:13px;background:#00ff88;border:none;border-radius:10px;font-size:17px;font-weight:bold;cursor:pointer;margin:5px 0}
#pairBox{margin-top:15px;font-size:30px;letter-spacing:4px;color:#00ff88;font-weight:bold;background:#000;padding:15px;border-radius:10px;display:none;word-break:break-all}
#qrBox{margin-top:20px;background:#fff;padding:15px;border-radius:15px;display:none}
#qrBox img{width:100%;max-width:280px}
.status{margin-top:15px;color:#aaa;font-size:13px}
h2{margin:0}
</style></head><body>
<div class="card">
<h2>🤖 MAHIR BOT</h2><p>Pairing System - Code + QR</p>
<input id="number" placeholder="8801XXXXXXXXX (no +)" />
<button onclick="getCode()">GET PAIR CODE AND QR CODE</button>
<div id="pairBox"></div>
<div id="qrBox"><p style="color:#000;font-weight:bold;margin:0 0 10px">Scan this QR with WhatsApp:</p><img id="qrImg" src="" /><p style="color:#000;font-size:12px">WhatsApp > Linked Devices > Link a Device</p></div>
<p class="status" id="status">Bot Status: Starting...</p>
<p style="font-size:12px;color:#666;text-align:left">
<b>নিয়ম:</b><br>
1. নাম্বার লিখো 8801xxx ( + ছাড়া )<br>
2. GET PAIR CODE চাপো<br>
3. উপরে Pair Code আসবে, নিচে QR আসবে<br>
4. যেকোনো একটা দিয়ে Pair করো। Code ২০ সেকেন্ডের মধ্যে বসাতে হবে।<br>
5. যদি Code এ Error আসে "Couldn't link" তাহলে QR Scan করো।
</p>
</div>
<script>
async function check() {
  let r = await fetch('/status'); let j = await r.json();
  document.getElementById('status').innerText = 'Bot Status: ' + j.status;
  if(j.qr){ document.getElementById('qrBox').style.display='block'; document.getElementById('qrImg').src=j.qr; }
}
setInterval(check,3000); check();
async function getCode(){
  let num=document.getElementById('number').value.replace(/[^0-9]/g,'');
  if(num.length<11)return alert('লিখো 8801911575104 এইভাবে, + ছাড়া');
  let box=document.getElementById('pairBox'); box.style.display='block'; box.innerText='Generating...';
  let res=await fetch('/pair?number='+num); let data=await res.json();
  if(data.code){ box.innerText=data.code; } else { box.innerText=data.error||'Error'; }
}
</script></body></html>
`);
});

app.get('/status', async (req, res) => {
  let qrData = null;
  if(lastQR){ try{ qrData = await QRCode.toDataURL(lastQR); }catch(e){} }
  res.json({ status: isPaired? 'Connected ✅ Bot is Online' : (lastQR? 'Scan QR or Get Pair Code' : 'Waiting for Pair Code...'), qr: qrData });
});

app.get('/pair', async (req, res) => {
  let number = req.query.number?.replace(/[^0-9]/g,'');
  if(!number) return res.json({ error: 'Number dao' });
  if(!sock) return res.json({ error: 'Bot starting, 10 sec por try koro' });
  try{ let code = await sock.requestPairingCode(number); res.json({ code }); }
  catch(e){ res.json({ error: 'Failed: '+e.message+' - Auth folder delete kore Clear Cache Deploy dao' }); }
});

app.listen(PORT, ()=>console.log('Server live '+PORT));

// ============ BOT LOGIC - ALL YOUR COMMANDS SAFE ============
let pendingAdd = {}, pendingAddGid = {}, pendingDownload = {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })) },
        logger: P({ level: 'silent' }),
        browser: ['Mahir Bot', 'Chrome', '1.0.0']
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect, qr } = u;
        if(qr){ lastQR = qr; console.log('New QR generated'); }
        if(connection==='open'){ isPaired=true; lastQR=null; console.log('BOT CONNECTED ✅'); }
        if(connection==='close'){
            isPaired=false;
            if(lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();
            else { console.log('Logged out, deleting auth'); fs.rmSync('./auth',{recursive:true,force:true}); startBot(); }
        }
    });

    const fullMenu = `╭───『 *MAHIR BOT* 』───\n│\n├─ *GROUP (Admin Only)*\n│ •.kick @user\n│ •.promote @user\n│ •.demote @user\n│ •.group open / close\n│ •.tagall [msg]\n│ •.add -> Select group & Add numbers\n│\n├─ *DOWNLOADER*\n│ •.yt /.fb /.tiktok /.ig\n│ •.download [link]\n│\n├─ *BROADCAST*\n│ •.broadcast [msg]\n│ •.bcgc [msg]\n│\n├─ *BOT*\n│ • hi / hello /.menu\n╰─────────────────`;

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
        if(lower==='.add'){ const allGroups=await sock.groupFetchAllParticipating(); const list=Object.values(allGroups); let msg='*Select Group to Add:*\n\n'; list.forEach((g,i)=>msg+=`*${i+1}.* ${g.subject}\n`); msg+='\nReply:.select 1'; pendingAdd[sender]=list; await sock.sendMessage(from,{text:msg},{quoted:m}); }
        if(text.startsWith('.select ')){ const num=parseInt(text.split(' ')[1])-1; const list=pendingAdd[sender]; if(!list||!list[num]) return; pendingAddGid[sender]=list[num].id; await sock.sendMessage(from,{text:`*Selected:* ${list[num].subject}\n\nNow send:\n.add\n8801xxxx\n8801xxxx`},{quoted:m}); }
        if(text.startsWith('.add\n')){ const groupId=pendingAddGid[sender]; if(!groupId) return; let numbers=text.replace('.add','').trim().split(/[\n, ]+/).filter(n=>n.length>=11); let jids=numbers.map(n=>n.replace(/[^0-9]/g,'')+'@s.whatsapp.net').slice(0,20); try{ await sock.groupParticipantsUpdate(groupId,jids,'add'); await sock.sendMessage(from,{text:`✅ Added ${jids.length} members!`}); }catch(e){ await sock.sendMessage(from,{text:`Failed! Bot admin koro. ${e.message}`}); } }
        if(text.startsWith('.yt ')||lower==='.yt'){ if(text.split(' ').length===1){ pendingDownload[sender]='yt'; return sock.sendMessage(from,{text:'*YouTube Downloader*\n\nSend link now'},{quoted:m}); } await handleDownload(sock,from,m,text.split(' ')[1]); }
        if(text.startsWith('.fb ')||text.startsWith('.tiktok ')||text.startsWith('.ig ')||text.startsWith('.download ')){ await handleDownload(sock,from,m,text.split(' ')[1]); }
        if((text.includes('youtu')||text.includes('facebook')||text.includes('tiktok')||text.includes('instagram'))&&pendingDownload[sender]){ await handleDownload(sock,from,m,text); delete pendingDownload[sender]; }
    });
    async function handleDownload(sock,from,m,url){ try{ await sock.sendMessage(from,{text:'⏳ Downloading... '+url},{quoted:m}); let apiUrl=`https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`; if(url.includes('tiktok')) apiUrl=`https://api.akuari.my.id/downloader/tiktok?link=${encodeURIComponent(url)}`; if(url.includes('fb')||url.includes('facebook')) apiUrl=`https://api.akuari.my.id/downloader/fb?link=${encodeURIComponent(url)}`; if(url.includes('instagram')) apiUrl=`https://api.akuari.my.id/downloader/ig?link=${encodeURIComponent(url)}`; const res=await axios.get(apiUrl); let videoUrl=res.data?.respon?.url||res.data?.respon?.link||res.data?.result?.url||res.data?.url||null; if(videoUrl) await sock.sendMessage(from,{video:{url:videoUrl},caption:`✅ Downloaded by Mahir Bot`},{quoted:m}); else await sock.sendMessage(from,{text:`Link: ${url}`},{quoted:m}); }catch(e){ await sock.sendMessage(from,{text:`❌ Failed: ${e.message}`},{quoted:m}); } }
}
startBot();
