const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;
let sock = null;
let isPaired = false;

function getMyPhoto() {
    const folders = ['./img', './image', './images'];
    for (let folder of folders) {
        if (fs.existsSync(folder)) {
            let files = fs.readdirSync(folder).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp'));
            if (files.length > 0) return path.join(folder, files[0]);
        }
    }
    return null;
}

// ==== PAIRING WEBSITE ====
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mahir Bot - Pair Code</title>
<style>
body { background: #0f0f0f; color: white; font-family: sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; }
.card { background: #1a1a1a; padding: 30px; border-radius: 15px; box-shadow: 0 0 20px #00ff88; width: 90%; max-width: 400px; text-align:center; border:1px solid #00ff88; }
input { width: 90%; padding: 12px; margin: 15px 0; border-radius: 8px; border: none; outline: none; font-size: 16px; }
button { width: 95%; padding: 12px; background: #00ff88; border: none; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; }
#codeBox { margin-top:20px; font-size: 32px; letter-spacing: 5px; color: #00ff88; font-weight: bold; background:#000; padding:15px; border-radius:10px; display:none; }
p { color: #aaa; font-size: 14px; }
</style>
</head>
<body>
<div class="card">
<h2>🤖 MAHIR BOT</h2>
<h3>Pairing Code Generator</h3>
<input id="number" type="text" placeholder="Enter WhatsApp Number: 8801xxxxxxxxx" />
<button onclick="getCode()">GET PAIR CODE</button>
<div id="codeBox"></div>
<p id="status">Bot Status: Checking...</p>
<p>1. Enter number with country code (8801xxx)<br>2. Click GET PAIR CODE<br>3. Copy code & open WhatsApp > Linked Devices > Link with Phone Number</p>
</div>
<script>
async function checkStatus() {
  let r = await fetch('/status');
  let j = await r.json();
  document.getElementById('status').innerText = 'Bot Status: ' + j.status;
}
setInterval(checkStatus, 3000); checkStatus();
async function getCode() {
  let num = document.getElementById('number').value.replace(/[^0-9]/g,'');
  if(num.length < 11) return alert('Enter valid number with country code: 8801xxxxxxxxx');
  document.getElementById('codeBox').style.display='block';
  document.getElementById('codeBox').innerText='Generating...';
  let res = await fetch('/pair?number='+num);
  let data = await res.json();
  if(data.code) {
    document.getElementById('codeBox').innerText = data.code;
  } else {
    document.getElementById('codeBox').innerText = data.error || 'Error';
  }
}
</script>
</body>
</html>
  `);
});

app.get('/status', (req, res) => {
  res.json({ status: isPaired? 'Connected ✅' : (sock? 'Waiting for Pair Code...' : 'Starting...') });
});

app.get('/pair', async (req, res) => {
  let number = req.query.number;
  if (!number) return res.json({ error: 'Number required' });
  if (!sock) return res.json({ error: 'Bot not started yet, wait 10 sec & retry' });
  try {
    // Baileys pairing code request
    let code = await sock.requestPairingCode(number);
    // format 1234-5678
    res.json({ code: code });
  } catch (e) {
    res.json({ error: 'Failed: ' + e.message });
  }
});

app.listen(PORT, () => console.log('Website Live on port ' + PORT));

// ==== BOT LOGIC ====
let pendingAdd = {};
let pendingAddGid = {};
let pendingDownload = {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    sock = makeWASocket({
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })) },
        logger: P({ level: 'silent' }),
        browser: ['Mahir Bot', 'Chrome', '1.0.0'],
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'open') { isPaired = true; console.log('BOT CONNECTED'); }
        if (connection === 'close') {
            isPaired = false;
            if (lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                startBot();
            }
        }
    });

    const fullMenu = `
╭───『 *MAHIR BOT* 』───
│ Hi, I'm *MAHIR* Bot 🤖
│
├─ *GROUP CONTROLLER*
│ •.kick @user
│ •.promote @user
│ •.demote @user
│ •.group open / close
│ •.tagall [msg]
│ •.add -> Select Group & Add 10/20 nums
│
├─ *DOWNLOADER*
│ •.download [link]
│ •.yt [youtube link]
│ •.fb [fb link]
│ •.tiktok [tiktok link]
│ •.ig [ig link]
│
├─ *BROADCAST*
│ •.broadcast [message]
│
├─ *MENU*
│ • hi / hello /.menu
╰─────────────────`;

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "").trim();
        const sender = m.key.participant || from;
        const lower = text.toLowerCase();

        if (['hi', 'hello', 'salam', 'menu', '.menu'].includes(lower)) {
            const photoPath = getMyPhoto();
            try {
                if (photoPath) await sock.sendMessage(from, { image: fs.readFileSync(photoPath), caption: fullMenu }, { quoted: m });
                else await sock.sendMessage(from, { text: fullMenu }, { quoted: m });
            } catch { await sock.sendMessage(from, { text: fullMenu }, { quoted: m }); }
            return;
        }

        if (text.startsWith('.kick') && isGroup) {
            const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (!mentioned) return sock.sendMessage(from, { text: 'Ex:.kick @user' }, { quoted: m });
            await sock.groupParticipantsUpdate(from, mentioned, 'remove');
        }
        if (text.startsWith('.promote') && isGroup) {
            const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned) await sock.groupParticipantsUpdate(from, mentioned, 'promote');
        }
        if (text.startsWith('.demote') && isGroup) {
            const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentioned) await sock.groupParticipantsUpdate(from, mentioned, 'demote');
        }
        if (text === '.group close' && isGroup) await sock.groupSettingUpdate(from, 'announcement');
        if (text === '.group open' && isGroup) await sock.groupSettingUpdate(from, 'not_announcement');
        if (text.startsWith('.tagall') && isGroup) {
            const meta = await sock.groupMetadata(from);
            const members = meta.participants.map(p => p.id);
            const msg = text.replace('.tagall', '').trim() || 'Attention Everyone!';
            await sock.sendMessage(from, { text: msg, mentions: members }, { quoted: m });
        }

        if (text.startsWith('.broadcast') || text.startsWith('.bcgc')) {
            const msg = text.replace('.broadcast', '').replace('.bcgc', '').trim();
            if (!msg) return;
            const allGroups = await sock.groupFetchAllParticipating();
            for (let id of Object.keys(allGroups)) await sock.sendMessage(id, { text: `*📢 BROADCAST:*\n\n${msg}` });
            await sock.sendMessage(from, { text: `✅ Sent to ${Object.keys(allGroups).length} groups` });
        }

        if (lower === '.add') {
            const allGroups = await sock.groupFetchAllParticipating();
            const list = Object.values(allGroups);
            let msg = '*Select Group:*\n\n';
            list.forEach((g, i) => msg += `*${i + 1}.* ${g.subject}\n`);
            msg += `\nReply:.select 1`;
            pendingAdd[sender] = list;
            await sock.sendMessage(from, { text: msg }, { quoted: m });
        }
        if (text.startsWith('.select ')) {
            const num = parseInt(text.split(' ')[1]) - 1;
            const list = pendingAdd[sender];
            if (!list ||!list[num]) return;
            pendingAddGid[sender] = list[num].id;
            await sock.sendMessage(from, { text: `Selected: ${list[num].subject}\n\nNow send:\n.add\n8801xxxx\n8801xxxx` }, { quoted: m });
        }
        if (text.startsWith('.add\n')) {
            const groupId = pendingAddGid[sender];
            if (!groupId) return;
            let numbers = text.replace('.add', '').trim().split(/[\n, ]+/).filter(n => n.length >= 11);
            let jids = numbers.map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net').slice(0, 20);
            try {
                await sock.groupParticipantsUpdate(groupId, jids, 'add');
                await sock.sendMessage(from, { text: `✅ Added ${jids.length} members!` });
            } catch (e) { await sock.sendMessage(from, { text: `Failed! Bot must be admin. ${e.message}` }); }
        }

        if (text.startsWith('.yt ') || lower === '.yt') {
            if (text.split(' ').length === 1) { pendingDownload[sender] = 'yt'; return sock.sendMessage(from, { text: '*YouTube Downloader*\n\nSend YouTube link now.' }, { quoted: m }); }
            await handleDownload(sock, from, m, text.split(' ')[1]);
        }
        if (text.startsWith('.fb ') || text.startsWith('.tiktok ') || text.startsWith('.ig ') || text.startsWith('.download ')) {
            await handleDownload(sock, from, m, text.split(' ')[1]);
        }
        if ((text.includes('youtu') || text.includes('facebook') || text.includes('tiktok') || text.includes('instagram')) && pendingDownload[sender]) {
            await handleDownload(sock, from, m, text); delete pendingDownload[sender];
        }
    });

    async function handleDownload(sock, from, m, url) {
        try {
            await sock.sendMessage(from, { text: '⏳ Downloading... ' + url }, { quoted: m });
            let apiUrl = `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`;
            if (url.includes('tiktok')) apiUrl = `https://api.akuari.my.id/downloader/tiktok?link=${encodeURIComponent(url)}`;
            if (url.includes('fb') || url.includes('facebook')) apiUrl = `https://api.akuari.my.id/downloader/fb?link=${encodeURIComponent(url)}`;
            if (url.includes('instagram')) apiUrl = `https://api.akuari.my.id/downloader/ig?link=${encodeURIComponent(url)}`;
            const res = await axios.get(apiUrl);
            let videoUrl = res.data?.respon?.url || res.data?.respon?.link || res.data?.result?.url || res.data?.url || null;
            if (videoUrl) await sock.sendMessage(from, { video: { url: videoUrl }, caption: `✅ Downloaded by Mahir Bot` }, { quoted: m });
            else await sock.sendMessage(from, { text: `Link received: ${url}` }, { quoted: m });
        } catch (e) { await sock.sendMessage(from, { text: `❌ Failed: ${e.message}` }, { quoted: m }); }
    }
}
startBot();
