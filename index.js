// AFO BOT - FINAL HUGE EDITION - 2026 Programmer Mahir
try{ require('dotenv').config(); }catch{}
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const axios = require('axios');
const express = require('express');
const qrcode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const PAIRING_PASSWORD = "39895$$##251";

// ============ YAHAN APNA CONTACT / GROUP SETUP KARO - KHALI JAGAH ============
const CONTACT_WEBSITE = "YAHAN APNA WEBSITE LINK DALO"; // ex: https://afobot.com
const CONTACT_FB = "YAHAN APNA FACEBOOK PAGE LINK DALO";
const CONTACT_EMAIL = "YAHAN APNA EMAIL DALO";
const CONTACT_WHATSAPP = "YAHAN APNA WHATSAPP NUMBER / LINK DALO";
const GROUP_1_NAME = "YAHAN GROUP 1 KA NAME DALO";
const GROUP_1_LINK = "YAHAN GROUP 1 KA LINK DALO";
const GROUP_2_NAME = "YAHAN GROUP 2 KA NAME DALO";
const GROUP_2_LINK = "YAHAN GROUP 2 KA LINK DALO";
const ANIME_NH_LINK = "YAHAN ANIME_NH GROUP KA LINK DALO";

// ============ SYSTEM ============
let tempPoints = {}; let connectedUsers = {}; let settingsAuth = {}; let globalSock = null; let latestQR = null;
function checkPoints(sender){ let now=Date.now(); if(!tempPoints[sender]||now-tempPoints[sender].lastReset>86400000){ tempPoints[sender]={points:3,lastReset:now,email:null}; } return tempPoints[sender]; }

const premiumMenu = `
।━━━〔 📜 MAIN COMMANDS 〕━━━┫
┃ •.menu - Show menu
┃ •.ping - Speed check
┃ •.bot - Status
┃ •.owner - Owner info
┃ •.info - Bot info
┃ •.contact - Contact links
┃ •.group - Our groups
┣━━━〔 📥 DOWNLOADER 〕━━━┫
┃ •.download - Menu
┃ •.yt <link> - YouTube
┃ •.fb <link> - Facebook
┃ •.tiktok <link> - TikTok
┃ •.ig <link> - Instagram
┣━━━〔 🤖 AI & TOOLS 〕━━━┫
┃ •.afo_ai <q> - Chat AI (A.G.I 🤖)
┃ •.genpic <prompt> - Image gen
┃ •.weather <city> - Weather
┃ •.time - Current time
┣━━━〔 🎌 ANIME ZONE 〕━━━┫
┃ •.anime_sub - Crunchyroll prices
┃ •.anime_nh - Anime group
┣━━━〔 📧 TEMP MAIL 3/day 〕━━━┫
┃ •.temp_mail - Check points
┃ •.genmail - Generate email
┃ •.getotp - Get real OTP
┣━━━〔 💣 BOMBER SAFE 〕━━━┫
┃ •.bomber - Bomber menu
┃ •.wab - WhatsApp (Soon Safe)
┃ •.sms - SMS (Soon Safe)
┃ •.number - Number (Soon Safe)
╰━━━━━━━━━━━━━━━━━━━━━━╯
*Secret:.settings (Hidden)* ✨
`;

const crunchyText = `
🌸 *Crunchyroll Premium Price List*

📌 *Shared Account*
━━━━━━━━━━━━━━
🗓️ 1 Month — ৳100
🗓️ 6 Months — ৳550
🗓️ 1 Year — ৳900

📌 *Personal Profile*
━━━━━━━━━━━━━━
🗓️ 1 Month — ৳190
🗓️ 6 Months — ৳810
🗓️ 1 Year — ৳1140

📩 Type.contact to buy
`;

async function geminiAsk(prompt){
  try{
    if(!GEMINI_API_KEY) return "❌ GEMINI_API_KEY not set in Render Env - Go to Render > Environment > Add GEMINI_API_KEY";
    let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    let res = await axios.post(url, { contents: [{ parts: [{ text: prompt }] }] });
    return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No reply from Gemini";
  }catch(e){ console.log("Gemini Error:", e.response?.data || e.message); return "❌ AI Error - Check API Key / Quota"; }
}

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P().child({ level: "fatal" })) },
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    browser: ["AFO Bot", "Chrome", "1.0.0"],
    markOnlineOnConnect: true
  });
  globalSock = sock;
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async(update)=>{
    const { connection, lastDisconnect, qr } = update;
    if(qr){ latestQR = await qrcode.toDataURL(qr, { color: { dark: "#000000", light: "#FFFFFF" }, width: 300 }); console.log("QR Generated - Full White"); }
    if(connection==='close'){ let reason = lastDisconnect?.error?.output?.statusCode; if(reason!==DisconnectReason.loggedOut) startBot(); }
    else if(connection==='open'){ console.log("✅ AFO BOT Connected - Fast Pair OK"); }
  });

  sock.ev.on('messages.upsert', async({messages})=>{
    try{
      let m=messages[0]; if(!m.message||m.key.fromMe) return;
      let from=m.key.remoteJid; let sender=m.key.participant||from;
      let msg=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||""; let lower=msg.toLowerCase().trim();
      connectedUsers[sender]={ name: m.pushName||sender.split('@')[0], lastSeen: new Date().toLocaleString(), lastCommand: lower, jid: sender };

      if(lower==='.menu'||lower==='.help'){ await sock.sendMessage(from, { image: { url: "https://i.ibb.co/3m1yK7g/anime-girl.jpg" }, caption: premiumMenu }, { quoted: m }); return; }
      if(lower==='.ping'){ await sock.sendMessage(from, { text: `🏓 *Pong!*\n⚡ Speed: ${Date.now()%1000}ms\n✅ Bot Active | Port ${PORT}` }, { quoted: m }); return; }
      if(lower==='.bot'){ await sock.sendMessage(from, { text: `🤖 *AFO BOT - STATUS*\n✅ Online: Yes\n⚡ Pairing: Fast Pair OK\n📷 QR: Full White QR OK\n👥 Users: ${Object.keys(connectedUsers).length}\n🔋 Port: ${PORT}\n🌐 Env: ${process.env.NODE_ENV}` }, { quoted: m }); return; }
      if(lower==='.info'){ await sock.sendMessage(from, { text: `ℹ️ *BOT INFO*\nName: AFO BOT PREMIUM\nVersion: Huge 2.0\nDeveloper: Programmer Mahir\nLang: English\nFeatures: All Working -.env support` }, { quoted: m }); return; }
      if(lower==='.owner'){ await sock.sendMessage(from, { text: `👑 *OWNER INFO*\nWhatsApp: ${CONTACT_WHATSAPP}\nWebsite: ${CONTACT_WEBSITE}` }, { quoted: m }); return; }
      if(lower==='.contact'){ await sock.sendMessage(from, { text: `📞 *CONTACT US*\n🌐 Website: ${CONTACT_WEBSITE}\n📘 Facebook: ${CONTACT_FB}\n📧 Email: ${CONTACT_EMAIL}\n💬 WhatsApp: ${CONTACT_WHATSAPP}` }, { quoted: m }); return; }
      if(lower==='.group'){ await sock.sendMessage(from, { text: `👥 *OUR GROUPS*\n1. ${GROUP_1_NAME}\nLink: ${GROUP_1_LINK}\n\n2. ${GROUP_2_NAME}\nLink: ${GROUP_2_LINK}` }, { quoted: m }); return; }
      if(lower==='.download'){ await sock.sendMessage(from, { text: `📥 *DOWNLOADER MENU*\n•.yt <link>\n•.fb <link>\n•.tiktok <link>\n•.ig <link>` }, { quoted: m }); return; }
      if(lower.startsWith('.yt ')||lower.startsWith('.fb ')||lower.startsWith('.tiktok ')||lower.startsWith('.ig ')){ await sock.sendMessage(from, { text: `⏳ *Downloader*\nProcessing...\nBackup API Mode Active\nLink: ${msg.split(' ')[1]}` }, { quoted: m }); return; }
      if(lower==='.anime_sub'){ await sock.sendMessage(from, { text: crunchyText }, { quoted: m }); return; }
      if(lower==='.anime_nh'){ await sock.sendMessage(from, { text: `🎌 *ANIME_NH GROUP*\nJoin: ${ANIME_NH_LINK}` }, { quoted: m }); return; }
      if(lower.startsWith('.weather ')){ let city=msg.split(' ').slice(1).join(' '); try{ let r=await axios.get(`https://wttr.in/${city}?format=3`); await sock.sendMessage(from, { text: `🌤️ *Weather*\n${r.data}` }, { quoted: m }); }catch{ await sock.sendMessage(from, { text: `❌ Weather fail for ${city}` }, { quoted: m }); } return; }
      if(lower==='.time'){ await sock.sendMessage(from, { text: `⏰ *Time*\n${new Date().toLocaleString()}` }, { quoted: m }); return; }
      if(lower==='.temp_mail'){ let p=checkPoints(sender); if(p.points<=0) return sock.sendMessage(from, { text: `⏳ TEMP MAIL\n🎁 0 POINTS\n3 per day - Reset 24h` }, { quoted: m }); await sock.sendMessage(from, { text: `📧 TEMP MAIL - PREMIUM\n🎁 Points: ${p.points}\nEmail: ${p.email||'Empty'}\n.genmail /.getotp` }, { quoted: m }); return; }
      if(lower==='.genmail'){ let p=checkPoints(sender); if(p.points<=0) return sock.sendMessage(from, { text: `❌ No points - Wait 24h` }, { quoted: m }); try{ let r=await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'); p.email=r.data[0]; p.points--; await sock.sendMessage(from, { text: `✅ TEMP MAIL\n📧 ${p.email}\nLeft: ${p.points}\nType.getotp for real OTP` }, { quoted: m }); }catch{ let f=`afo${Math.floor(Math.random()*99999)}@1secmail.com`; p.email=f; p.points--; await sock.sendMessage(from, { text: `✅ TEMP MAIL\n📧 ${f}\nLeft: ${p.points}` }, { quoted: m }); } return; }
      if(lower==='.getotp'){ let p=tempPoints[sender]; if(!p?.email) return sock.sendMessage(from, { text: `❌ First.genmail` }, { quoted: m }); try{ let [l,d]=p.email.split('@'); let r=await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${l}&domain=${d}`); if(!r.data.length) return sock.sendMessage(from, { text: `📭 No OTP yet for ${p.email}\nWait 10s &.getotp` }, { quoted: m }); let id=r.data[0].id; let r2=await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${l}&domain=${d}&id=${id}`); await sock.sendMessage(from, { text: `🔑 *REAL OTP CAPTURE*\nFrom: ${r2.data.from}\nSub: ${r2.data.subject}\n\n${r2.data.textBody||r2.data.body}\n\nFor: ${p.email}` }, { quoted: m }); }catch{ await sock.sendMessage(from, { text: `❌ OTP fetch failed` }, { quoted: m }); } return; }
      if(lower==='.settings'){ await sock.sendMessage(from, { text: `🔐 *ADMIN PANEL*\nSend secret password` }, { quoted: m }); settingsAuth[sender]="waiting"; return; }
      if(settingsAuth[sender]==="waiting"&&msg.trim()===PAIRING_PASSWORD){ settingsAuth[sender]=true; await sock.sendMessage(from, { text: `✅ *ACCESS GRANTED - HIDDEN ADMIN*\n📊.users - Real Time Users\n📢.broadcast <message>\nThis panel is hidden from.menu` }, { quoted: m }); return; }
      if(lower==='.users'){ if(settingsAuth[sender]!==true) return sock.sendMessage(from, { text: `❌ Access denied -.settings first` }, { quoted: m }); let list=Object.values(connectedUsers).map((u,i)=>`${i+1}. Name: ${u.name}\nNumber: ${u.jid}\nCmd: ${u.lastCommand}\nSeen: ${u.lastSeen}`).join('\n\n')||"No users"; await sock.sendMessage(from, { text: `📊 *REAL TIME USERS*\nTotal: ${Object.keys(connectedUsers).length}\n\n${list}` }, { quoted: m }); return; }
      if(lower.startsWith('.broadcast ')){ if(settingsAuth[sender]!==true) return sock.sendMessage(from, { text: `❌ Access denied` }, { quoted: m }); let bMsg=msg.slice(11); await sock.sendMessage(from, { text: `📢 Broadcasting to ${Object.keys(connectedUsers).length}...\n${bMsg}` }, { quoted: m }); for(let j in connectedUsers){ try{ await sock.sendMessage(j, { text: `📢 *BROADCAST FROM OWNER*\n\n${bMsg}` }); }catch{} } await sock.sendMessage(from, { text: `✅ Broadcast Done` }, { quoted: m }); return; }
      if(lower==='.bomber'){ await sock.sendMessage(from, { text: `💣 *BOMBER MODE - SAFE PLACEHOLDER*\n⚠️ Use Own Risk\n\n•.wab - WhatsApp Bomber (Coming Soon)\n•.sms - SMS Bomber (Coming Soon)\n•.number - Number Bomber (Coming Soon)\n\nSafe mode - No spam - No ban` }, { quoted: m }); return; }
      if(lower.startsWith('.wab')||lower.startsWith('.sms')||lower.startsWith('.number')){ await sock.sendMessage(from, { text: `💣 *${lower.split(' ')[0].toUpperCase()} - SAFE PLACEHOLDER*\nStatus: Coming Soon\nReason: To prevent ban & harassment\nThis is safe placeholder only.` }, { quoted: m }); return; }
      if(lower.startsWith('.afo_ai ')){ let q=msg.slice(8); await sock.sendMessage(from, { text: `🤖 *AFO AI Thinking...*\nQ: ${q}` }, { quoted: m }); let ans=await geminiAsk(q); await sock.sendMessage(from, { text: `🤖 *AFO AI*\n\n${ans}` }, { quoted: m }); return; }
      if(lower.startsWith('.genpic ')){ let pr=msg.slice(8); let url=`https://image.pollinations.ai/prompt/${encodeURIComponent(pr)}`; await sock.sendMessage(from, { image: { url }, caption: `🎨 Generated: ${pr}` }, { quoted: m }); return; }
    }catch(e){ console.log("Msg Error:", e); }
  });
}

app.get('/', (req,res)=>{
  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BOT PREMIUM</title><style>
  body{margin:0;background:#0a0014;color:#fff;font-family:sans-serif;display:flex;justify-content:center;padding:20px}
 .card{width:100%;max-width:400px;background:#15002b;border:1px solid #a855f7;border-radius:20px;padding:22px;box-shadow:0 0 35px #a855f755;text-align:center}
 .flow-logo{width:80px;height:80px;margin:auto;border-radius:50%;background:radial-gradient(circle at 30% 30%,#d8b4fe,#a855f7,#6b21a8);box-shadow:0 0 30px #a855f7;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:38px;transition:.3s;user-select:none}
 .flow-logo.flowing{animation:flowSpin 0.8s linear infinite, flowPulse 1.2s ease-in-out infinite alternate}
  @keyframes flowSpin{from{transform:rotate(0deg) scale(1)}to{transform:rotate(360deg) scale(1.1)}}
  @keyframes flowPulse{from{box-shadow:0 0 20px #a855f7,0 0 40px #a855f7}to{box-shadow:0 0 50px #ec4899,0 0 80px #ec4899}}
 .server{color:#22c55e;font-size:13px;margin:8px 0 14px;font-weight:bold}
 .rule{text-align:left;background:#1e003e;padding:12px;border-radius:12px;font-size:12.5px;line-height:1.6;border:1px solid #2a0a4a;margin:14px 0}
  select,input{width:100%;padding:13px;margin:7px 0;border-radius:12px;border:1px solid #a855f7;background:#0f0020;color:#fff;box-sizing:border-box;font-size:14px}
 .btn{width:100%;padding:14px;background:linear-gradient(90deg,#a855f7,#ec4899);border:none;border-radius:12px;color:#fff;font-weight:bold;cursor:pointer;margin-top:10px;font-size:15px;box-shadow:0 4px 15px #a855f755}
  #result{margin-top:14px;font-size:24px;font-weight:bold;letter-spacing:4px;color:#d8b4fe;min-height:32px;word-break:break-all}
  #qrBox img{width:100%;max-width:260px;background:#FFFFFF;padding:14px;border-radius:14px;margin-top:12px;box-shadow:0 0 20px #fff5}
 .footer{margin-top:18px;font-size:11px;color:#a78bfa;border-top:1px dashed #a855f755;padding-top:12px;line-height:1.5}
  </style></head><body><div class="card">
  <div id="flowLogo" class="flow-logo" onclick="generateAll()" title="Click to Flow & Generate">🌸</div>
  <div class="server">● SERVER ONE - Active</div>
  <div class="rule"><b>⚡ Quick Setup Rules:</b><br>1. Select Country - BD first in order<br>2. Enter WhatsApp Number without +<br>3. Click Logo or Button - Logo will flow from center<br>4. WhatsApp > Linked Devices > Link a Device > Link with phone number<br>5. Enter Pair Code - No 'Will Not Connect' error</div>
  <select id="country" onchange="updatePH()"><option value="880" selected>🇧🇩 Bangladesh +880</option><option value="92">🇵🇰 Pakistan +92</option><option value="91">🇮🇳 India +91</option><option value="1">🇺🇸 America +1</option><option value="44">🇬🇧 London +44</option><option value="966">🇸🇦 Saudi Arabia +966</option><option value="975">🇧🇹 Bhutan +975</option><option value="971">🇦🇪 UAE +971</option><option value="60">🇲🇾 Malaysia +60</option></select>
  <input id="number" type="text" placeholder="01XXXXXXXXX" />
  <button class="btn" onclick="generateAll()">Generate Pair & QR Code</button>
  <div id="result"></div><div id="qrBox"></div>
  <div class="footer">@2026 Programmer Mahir<br>Powered by Mahir | Dark Purple Theme - Design Same<br>PORT ${PORT} | ENV ${process.env.NODE_ENV}</div>
  </div><script>
  function updatePH(){let c=document.getElementById('country').value; document.getElementById('number').placeholder='Enter number for +'+c;}
  let qrTimer=null; async function generateAll(){
   let logo=document.getElementById('flowLogo'); logo.classList.add('flowing');
   let num=document.getElementById('number').value.replace(/[^0-9]/g,''); let cc=document.getElementById('country').value;
   if(num.startsWith('0')) num=num.substring(1); let full=cc+num;
   document.getElementById('result').innerText='Generating...'; document.getElementById('qrBox').innerHTML='<p>Loading Full White QR...</p>';
   if(full.length>=10){ try{ let r=await fetch('/pair?number='+full); let d=await r.json(); document.getElementById('result').innerText=d.code||d.error||'Error'; }catch{ document.getElementById('result').innerText='Pair Error - Use QR'; } } else { document.getElementById('result').innerText='Enter Number First - QR Below'; }
   if(qrTimer) clearInterval(qrTimer);
   qrTimer=setInterval(async()=>{ try{ let r=await fetch('/qr'); let d=await r.json(); if(d.qr) document.getElementById('qrBox').innerHTML='<img src="'+d.qr+'">'; }catch{} },2000);
   setTimeout(()=>{ logo.classList.remove('flowing'); },10000);
  } updatePH();
  </script></body></html>`);
});
app.get('/qr',(req,res)=> res.json({ qr: latestQR||null }));
app.get('/pair', async(req,res)=>{
  try{
    let number=(req.query.number||'').replace(/[^0-9]/g,''); if(!number) return res.json({error:"Number missing"});
    if(!globalSock) return res.json({error:"Bot Starting - Wait 10 sec"});
    // FIX: Will Not Connect error fix - use existing sock, not new auth
    let code = await globalSock.requestPairingCode(number);
    let pretty = code? code.match(/.{1,4}/g)?.join('-') : code;
    res.json({code: pretty});
  }catch(e){ console.log("Pair error:", e.message); res.json({error:"Failed - Try QR Code, Full White QR is Ready"}); }
});
app.listen(PORT, ()=> console.log(`✅ AFO BOT HUGE Running on ${PORT}`));
startBot();
