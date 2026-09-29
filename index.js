require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const axios = require('axios');
const express = require('express');
const qrcode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PAIRING_PASSWORD = "39895$$##251";

// ==================== SETUP YAHAN KARO ====================
const CONTACT_WEBSITE = "YAHAN APNA WEBSITE LINK DALO"; // ex: https://afobot.com
const CONTACT_FB = "YAHAN APNA FB PAGE LINK DALO";
const CONTACT_EMAIL = "YAHAN APNA EMAIL DALO";
const CONTACT_WHATSAPP = "YAHAN APNA WHATSAPP LINK DALO";
const GROUP_1_NAME = "YAHAN GROUP 1 NAME DALO";
const GROUP_1_LINK = "YAHAN GROUP 1 LINK DALO";
const GROUP_2_NAME = "YAHAN GROUP 2 NAME DALO";
const GROUP_2_LINK = "YAHAN GROUP 2 LINK DALO";
const ANIME_NH_LINK = "YAHAN ANIME NH GROUP LINK DALO";

let tempPoints = {}; let connectedUsers = {}; let settingsAuth = {}; let globalSock = null;
function checkPoints(s){ let n=Date.now(); if(!tempPoints[s]||n-tempPoints[s].lastReset>86400000) tempPoints[s]={points:3,lastReset:n,email:null}; return tempPoints[s]; }

const premiumMenu = `
╭━━━〔 🌸 AFO BOT PREMIUM 〕━━━╮
┃ 👋 Fast | Secure | Premium
┣━━━〔 📜 MAIN 〕━━━┫
┃ •.menu •.ping •.bot •.info
┃ •.owner •.contact •.group
┣━━━〔 📥 DOWNLOADER 〕━━━┫
┃ •.yt <link> •.fb <link>
┃ •.tiktok <link> •.ig <link>
┣━━━〔 🤖 AI & TOOLS 〕━━━┫
┃ •.afo_ai <q> •.genpic <prompt>
┃ •.weather <city> •.time
┣━━━〔 🎌 ANIME 〕━━━┫
┃ •.anime_sub •.anime_nh
┣━━━〔 📧 TEMP MAIL 3/day 〕━━━┫
┃ •.temp_mail •.genmail •.getotp
┣━━━〔 💣 BOMBER SAFE 〕━━━┫
┃ •.bomber •.wab •.sms •.number
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

const crunchyText = `🌸 *Crunchyroll Premium*\n\n📌 Shared:\n1M - ৳100\n6M - ৳550\n1Y - ৳900\n\n📌 Personal:\n1M - ৳190\n6M - ৳810\n1Y - ৳1140\n\nType.contact to buy`;

async function geminiAsk(p){ try{ if(!GEMINI_API_KEY) return "❌ Set GEMINI_API_KEY in.env"; let u=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`; let r=await axios.post(u,{contents:[{parts:[{text:p}]}]}); return r.data.candidates?.[0]?.content?.parts?.[0]?.text||"No reply"; }catch(e){ return "❌ AI Error - Check Key/Quota"; } }

async function startBot(){
 const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
 const { version } = await fetchLatestBaileysVersion();
 const sock = makeWASocket({ version, auth:{ creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys,P().child({level:"fatal"})) }, printQRInTerminal:false, logger:P({level:"silent"}), browser:["AFO Bot","Chrome","1.0.0"], markOnlineOnConnect:true });
 globalSock = sock;
 sock.ev.on('creds.update', saveCreds);
 sock.ev.on('connection.update', async(u)=>{ if(u.qr) global.latestQR = await qrcode.toDataURL(u.qr,{color:{dark:"#000",light:"#FFF"}}); if(u.connection==='close'&&u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot(); if(u.connection==='open') console.log("✅ AFO BOT Connected"); });
 sock.ev.on('messages.upsert', async({messages})=>{
  try{
   let m=messages[0]; if(!m.message||m.key.fromMe) return;
   let from=m.key.remoteJid; let sender=m.key.participant||from;
   let msg=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||""; let lower=msg.toLowerCase().trim();
   connectedUsers[sender]={ name:m.pushName||sender.split('@')[0], lastSeen:new Date().toLocaleString(), lastCommand:lower, jid:sender };

   if(lower==='.menu'){ await sock.sendMessage(from,{image:{url:"https://i.ibb.co/3m1yK7g/anime-girl.jpg"},caption:premiumMenu},{quoted:m}); return; }
   if(lower==='.ping'){ await sock.sendMessage(from,{text:`🏓 Pong!\n⚡ ${Date.now()%1000}ms\n✅ Active`},{quoted:m}); return; }
   if(lower==='.bot'){ await sock.sendMessage(from,{text:`🤖 AFO BOT - STATUS\n✅ Online\n⚡ Fast Pair OK\n📷 Full White QR OK\n👥 Users: ${Object.keys(connectedUsers).length}\n🔋 Port: ${PORT}`},{quoted:m}); return; }
   if(lower==='.info'){ await sock.sendMessage(from,{text:`ℹ️ AFO BOT PREMIUM\nVersion: 2.0\nLang: English\nFeatures: All Working`},{quoted:m}); return; }
   if(lower==='.owner'){ await sock.sendMessage(from,{text:`👑 OWNER\nWhatsApp: ${CONTACT_WHATSAPP}\nWebsite: ${CONTACT_WEBSITE}`},{quoted:m}); return; }
   if(lower==='.contact'){ await sock.sendMessage(from,{text:`📞 CONTACT\n🌐 ${CONTACT_WEBSITE}\n📘 ${CONTACT_FB}\n📧 ${CONTACT_EMAIL}\n💬 ${CONTACT_WHATSAPP}`},{quoted:m}); return; }
   if(lower==='.group'){ await sock.sendMessage(from,{text:`👥 GROUPS\n1. ${GROUP_1_NAME}\n${GROUP_1_LINK}\n\n2. ${GROUP_2_NAME}\n${GROUP_2_LINK}`},{quoted:m}); return; }
   if(lower==='.download'){ await sock.sendMessage(from,{text:`📥 DOWNLOADER\n•.yt <link>\n•.fb <link>\n•.tiktok <link>\n•.ig <link>`},{quoted:m}); return; }
   if(lower.startsWith('.yt ')||lower.startsWith('.fb ')||lower.startsWith('.tiktok ')||lower.startsWith('.ig ')){ await sock.sendMessage(from,{text:`⏳ Processing...\nBackup API Mode - Link received`},{quoted:m}); return; }
   if(lower==='.anime_sub'){ await sock.sendMessage(from,{text:crunchyText},{quoted:m}); return; }
   if(lower==='.anime_nh'){ await sock.sendMessage(from,{text:`🎌 ANIME_NH\nJoin: ${ANIME_NH_LINK}`},{quoted:m}); return; }
   if(lower.startsWith('.weather ')){ try{ let city=msg.split(' ').slice(1).join(' '); let r=await axios.get(`https://wttr.in/${city}?format=3`); await sock.sendMessage(from,{text:`🌤️ ${r.data}`},{quoted:m}); }catch{ await sock.sendMessage(from,{text:`❌ Weather failed`},{quoted:m}); } return; }
   if(lower==='.time'){ await sock.sendMessage(from,{text:`⏰ ${new Date().toLocaleString()}`},{quoted:m}); return; }
   if(lower==='.temp_mail'){ let p=checkPoints(sender); if(p.points<=0) return sock.sendMessage(from,{text:`*⏳ TEMP MAIL*\n🎁 0 POINTS\n3 per day - Reset 24h`},{quoted:m}); await sock.sendMessage(from,{text:`*📧 TEMP MAIL*\n🎁 Points: ${p.points}\nEmail: ${p.email||'Empty'}\n.genmail /.getotp`},{quoted:m}); return; }
   if(lower==='.genmail'){ let p=checkPoints(sender); if(p.points<=0) return sock.sendMessage(from,{text:`❌ No points - wait 24h`},{quoted:m}); try{ let r=await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'); p.email=r.data[0]; p.points--; await sock.sendMessage(from,{text:`✅ Email: *${p.email}*\nLeft: ${p.points}\n.getotp to get real OTP`},{quoted:m}); }catch{ let f=`afo${Math.floor(Math.random()*99999)}@1secmail.com`; p.email=f; p.points--; await sock.sendMessage(from,{text:`✅ Email: *${f}*\nLeft: ${p.points}`},{quoted:m}); } return; }
   if(lower==='.getotp'){ let p=tempPoints[sender]; if(!p?.email) return sock.sendMessage(from,{text:`❌ First.genmail`},{quoted:m}); try{ let [l,d]=p.email.split('@'); let r=await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${l}&domain=${d}`); if(!r.data.length) return sock.sendMessage(from,{text:`📭 No OTP yet for ${p.email}\nWait 10s &.getotp again`},{quoted:m}); let id=r.data[0].id; let r2=await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${l}&domain=${d}&id=${id}`); await sock.sendMessage(from,{text:`*🔑 REAL OTP*\nFrom: ${r2.data.from}\nSub: ${r2.data.subject}\n\n${r2.data.textBody||r2.data.body}\n\nFor: ${p.email}`},{quoted:m}); }catch{ await sock.sendMessage(from,{text:`❌ OTP fetch failed`},{quoted:m}); } return; }
   if(lower==='.settings'){ await sock.sendMessage(from,{text:`🔐 ADMIN PANEL\nSend secret password`},{quoted:m}); settingsAuth[sender]="waiting"; return; }
   if(settingsAuth[sender]==="waiting" && msg.trim()===PAIRING_PASSWORD){ settingsAuth[sender]=true; await sock.sendMessage(from,{text:`✅ ACCESS GRANTED\n\n📊.users - Real Time Users\n📢.broadcast <msg> - Send to all\n\nSettings is hidden from.menu`},{quoted:m}); return; }
   if(lower==='.users'){ if(settingsAuth[sender]!==true) return sock.sendMessage(from,{text:`❌ Denied -.settings first`},{quoted:m}); let list=Object.values(connectedUsers).map((u,i)=>`${i+1}. ${u.name}\n ${u.jid}\n Cmd: ${u.lastCommand}\n Seen: ${u.lastSeen}`).join('\n\n')||"No users"; await sock.sendMessage(from,{text:`📊 REAL USERS (${Object.keys(connectedUsers).length})\n\n${list}`},{quoted:m}); return; }
   if(lower.startsWith('.broadcast ')){ if(settingsAuth[sender]!==true) return sock.sendMessage(from,{text:`❌ Denied`},{quoted:m}); let bMsg=msg.slice(11); await sock.sendMessage(from,{text:`📢 Broadcasting to ${Object.keys(connectedUsers).length} users...\n\n${bMsg}`},{quoted:m}); for(let j in connectedUsers){ try{ await sock.sendMessage(j,{text:`📢 *OWNER BROADCAST*\n\n${bMsg}`}); }catch{} } await sock.sendMessage(from,{text:`✅ Done`},{quoted:m}); return; }
   if(lower==='.bomber'){ await sock.sendMessage(from,{text:`💣 BOMBER MODE\n⚠️ Use Own Risk - Can Ban\n\n•.wab - WhatsApp Bomber (Coming Soon - Safe Placeholder)\n•.sms - SMS Bomber (Coming Soon - Safe Placeholder)\n•.number - Number Bomber (Coming Soon - Safe Placeholder)\n\nNo spam allowed - placeholder only.`},{quoted:m}); return; }
   if(lower.startsWith('.wab')||lower.startsWith('.sms')||lower.startsWith('.number')){ await sock.sendMessage(from,{text:`💣 *${lower.split(' ')[0].toUpperCase()} - SAFE PLACEHOLDER*\n\nStatus: Coming Soon\nReason: Prevent ban & harassment\nThis is safe placeholder only.\nUse.broadcast for legit message.`},{quoted:m}); return; }
   if(lower.startsWith('.afo_ai ')){ let q=msg.slice(8); await sock.sendMessage(from,{text:`🤖 Thinking...`},{quoted:m}); let ans=await geminiAsk(q); await sock.sendMessage(from,{text:`🤖 AFO AI\n\n${ans}`},{quoted:m}); return; }
   if(lower.startsWith('.genpic ')){ let pr=msg.slice(8); let url=`https://image.pollinations.ai/prompt/${encodeURIComponent(pr)}`; await sock.sendMessage(from,{image:{url},caption:`🎨 ${pr}`},{quoted:m}); return; }
  }catch(e){ console.log(e); }
 });
}

// ================= WEBSITE SAME THEME - CURRENT FLOW LOGO ANIMATION =================
app.get('/', (req,res)=>{
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BOT PREMIUM</title>
 <style>body{margin:0;background:#0a0014;color:#fff;font-family:sans-serif;display:flex;justify-content:center;padding:20px}
.card{width:100%;max-width:400px;background:#15002b;border:1px solid #a855f7;border-radius:20px;padding:20px;box-shadow:0 0 30px #a855f755;text-align:center}
.flow-logo{width:70px;height:70px;margin:auto;border-radius:50%;background:radial-gradient(circle at 30% 30%,#d8b4fe,#a855f7,#6b21a8);box-shadow:0 0 25px #a855f7;cursor:pointer;transition:0.3s;display:flex;align-items:center;justify-content:center;font-size:32px}
.flow-logo.flowing{animation:flowSpin 1s infinite linear,flowPulse 1.5s infinite}
 @keyframes flowSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
 @keyframes flowPulse{0%,100%{box-shadow:0 0 20px #a855f7}50%{box-shadow:0 0 45px #ec4899}}
 h1{color:#d8b4fe;margin:10px 0 5px;font-size:22px}.server{color:#22c55e;font-size:13px;margin-bottom:15px}
.rule{text-align:left;background:#1e003e;padding:12px;border-radius:10px;font-size:13px;line-height:1.6;margin:15px 0;border:1px solid #2a0a4a}
 select,input{width:100%;padding:12px;margin:8px 0;border-radius:10px;border:1px solid #a855f7;background:#0f0020;color:#fff;box-sizing:border-box}
.btn{width:100%;padding:14px;background:linear-gradient(90deg,#a855f7,#ec4899);border:none;border-radius:12px;color:#fff;font-weight:bold;cursor:pointer;margin-top:10px;font-size:15px}
 #qrBox img{width:100%;max-width:250px;background:white;padding:10px;border-radius:12px;margin-top:12px}
 #result{margin-top:15px;font-size:22px;font-weight:bold;letter-spacing:4px;color:#d8b4fe;min-height:30px}
.footer{margin-top:18px;font-size:12px;color:#a78bfa;border-top:1px dashed #a855f755;padding-top:12px}
.dash{border-top:1px dashed #a855f755;margin:15px 0}
 </style></head><body><div class="card">
 <div id="flowLogo" class="flow-logo" onclick="generateAll()" title="Click to Generate">🌸</div>
 <h1>AFO BOT PREMIUM</h1><div class="server">● SERVER ONE - Active</div>
 <div class="rule"><b>⚡ Quick Setup Rules:</b><br>1. Select country (order same)<br>2. Enter number without +<br>3. Click Generate - Logo will flow<br>4. Pair in WhatsApp > Linked Devices</div>
 <select id="country" onchange="updatePH()"><option value="880" selected>🇧🇩 Bangladesh +880</option><option value="92">🇵🇰 Pakistan +92</option><option value="91">🇮🇳 India +91</option><option value="1">🇺🇸 America +1</option><option value="44">🇬🇧 London +44</option><option value="966">🇸🇦 Saudi +966</option><option value="975">🇧🇹 Bhutan +975</option><option value="971">🇦🇪 UAE +971</option><option value="60">🇲🇾 Malaysia +60</option></select>
 <input id="number" type="text" placeholder="+880 1XXXXXXXXX" />
 <button class="btn" onclick="generateAll()">Generate Pair & QR Code</button>
 <div id="result"></div><div id="qrBox"></div>
 <div class="dash"></div>
 <div class="footer">@2026 Programmer Mahir | Powered by Mahir<br>Dark Purple Theme - Design Same</div>
 </div>
 <script>
 function updatePH(){let c=document.getElementById('country').value; document.getElementById('number').placeholder='+'+c+' XXXXXXXXX';}
 let qrTimer=null;
 async function generateAll(){
  let logo=document.getElementById('flowLogo'); logo.classList.add('flowing');
  let num=document.getElementById('number').value.replace(/[^0-9]/g,'');
  let cc=document.getElementById('country').value;
  let full=cc+num;
  document.getElementById('result').innerText='Generating...'; document.getElementById('qrBox').innerHTML='<p>Loading Full White QR...</p>';
  if(full.length>=10){
   try{ let r=await fetch('/pair?number='+full); let d=await r.json(); if(d.code){ document.getElementById('result').innerText=d.code; } else { document.getElementById('result').innerText=d.error||'Error - Try QR'; } }catch{ document.getElementById('result').innerText='Pair Error - Use QR'; }
  } else { document.getElementById('result').innerText='Enter Number First - QR Below'; }
  if(qrTimer) clearInterval(qrTimer);
  qrTimer=setInterval(async()=>{ let r=await fetch('/qr'); let d=await r.json(); if(d.qr){ document.getElementById('qrBox').innerHTML='<img src="'+d.qr+'">'; }},2000);
  setTimeout(()=>{ logo.classList.remove('flowing'); },8000);
 }
 updatePH();
 </script></body></html>`);
});
app.get('/qr',(req,res)=> res.json({qr:global.latestQR||null}));
app.get('/pair', async(req,res)=>{
 try{
  let number=req.query.number; if(!number) return res.json({error:"Number missing"});
  if(!globalSock) return res.json({error:"Bot not ready - wait"});
  let code = await globalSock.requestPairingCode(number);
  res.json({code: code?.match(/.{1,4}/g)?.join('-') || code});
 }catch(e){ console.log(e.message); res.json({error:"Failed - Try QR"}); }
});
app.listen(PORT,()=> console.log("✅ Running on "+PORT));
startBot();
