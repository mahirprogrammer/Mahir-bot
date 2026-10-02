// @2026 Programmer Mahir - AFO BOT - FINAL FULL BRAIN + CURRENT + CONTACT
try{ require('dotenv').config(); }catch{}
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const axios = require('axios');
const express = require('express');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const PAIRING_PASSWORD = "39895$$##251";

// ============ YAHAN APNA CONTACT LINK DALO - KHALI JAGAH ============
const SELLER_CONTACT_LINK = "YAHAN APNA CONTACT LINK DALO - FB/WHATSAPP/WEBSITE"; // <--- Yahan link dalo bhai
const CONTACT_WEBSITE = "YAHAN WEBSITE DALO";
const CONTACT_FB = "YAHAN FB DALO";
const CONTACT_EMAIL = "YAHAN EMAIL DALO";
const GROUP_1_NAME = "YAHAN GROUP 1 NAME"; const GROUP_1_LINK = "YAHAN GROUP 1 LINK";
const GROUP_2_NAME = "YAHAN GROUP 2 NAME"; const GROUP_2_LINK = "YAHAN GROUP 2 LINK";

app.use('/IMG', express.static(path.join(__dirname, 'IMG')));
let tempPoints={}, connectedUsers={}, settingsAuth={}, globalSock=null, latestQR=null;
function checkPoints(s){let n=Date.now(); if(!tempPoints[s]||n-tempPoints[s].lastReset>86400000) tempPoints[s]={points:3,lastReset:n,email:null}; return tempPoints[s];}

const premiumMenu = `╭━━━〔 🌸 AFO BOT PREMIUM 〕━━━╮
┃.menu.ping.bot.info.owner
┃.contact.group.yt.fb.tiktok
┃.afo_ai.genpic.anime_sub
┃.temp_mail.genmail.getotp
┃.bomber.wab.sms - Safe Mode
╰━━━━━━━━━━━━━━━━━━╯`;

async function geminiAsk(p){try{if(!GEMINI_API_KEY) return "❌ Set GEMINI_API_KEY"; let u=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`; let r=await axios.post(u,{contents:[{parts:[{text:p}]}]}); return r.data.candidates?.[0]?.content?.parts?.[0]?.text||"No reply";}catch{return "❌ AI Error";}}

async function startBot(){
 const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
 const { version } = await fetchLatestBaileysVersion();
 const sock = makeWASocket({version, auth:{creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys,P().child({level:"fatal"}))}, logger:P({level:"silent"}), browser:["AFO Bot","Chrome","1.0.0"]});
 globalSock=sock;
 sock.ev.on('creds.update', saveCreds);
 sock.ev.on('connection.update', async(u)=>{
  if(u.qr){ latestQR = await qrcode.toDataURL(u.qr,{color:{dark:"#000000",light:"#FFFFFF"},width:340}); console.log("QR Ready White"); }
  if(u.connection==='close'&&u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();
 });
 sock.ev.on('messages.upsert', async({messages})=>{
  try{
   let m=messages[0]; if(!m.message||m.key.fromMe) return;
   let from=m.key.remoteJid; let sender=m.key.participant||from;
   let msg=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||""; let lower=msg.toLowerCase().trim();
   connectedUsers[sender]={name:m.pushName||sender.split('@')[0],jid:sender,lastCommand:lower,lastSeen:new Date().toLocaleString()};
   if(lower==='.menu'){
    let imgPath=path.join(__dirname,'IMG'); try{let files=fs.readdirSync(imgPath).filter(f=>f.endsWith('.jpg')||f.endsWith('.png')); if(files.length>0){await sock.sendMessage(from,{image:fs.readFileSync(path.join(imgPath,files[0])),caption:premiumMenu},{quoted:m}); return;}}catch{}
    await sock.sendMessage(from,{text:premiumMenu},{quoted:m}); return;
   }
   if(lower==='.ping') return sock.sendMessage(from,{text:`🏓 Pong Fast`},{quoted:m});
   if(lower==='.bot') return sock.sendMessage(from,{text:`🤖 AFO BOT Active Users:${Object.keys(connectedUsers).length}`},{quoted:m});
   if(lower==='.contact') return sock.sendMessage(from,{text:`📞 Website:${CONTACT_WEBSITE}\nFB:${CONTACT_FB}\nEmail:${CONTACT_EMAIL}\nSeller:${SELLER_CONTACT_LINK}`},{quoted:m});
   if(lower==='.group') return sock.sendMessage(from,{text:`👥 ${GROUP_1_NAME}:${GROUP_1_LINK}\n${GROUP_2_NAME}:${GROUP_2_LINK}`},{quoted:m});
   if(lower.startsWith('.afo_ai ')){let a=await geminiAsk(msg.slice(8)); return sock.sendMessage(from,{text:a},{quoted:m});}
   if(lower==='.temp_mail'){let p=checkPoints(sender); return sock.sendMessage(from,{text:`📧 Points ${p.points}/3 Email ${p.email||'Empty'}`},{quoted:m});}
   if(lower==='.genmail'){let p=checkPoints(sender); if(p.points<=0) return sock.sendMessage(from,{text:`❌ 0 Points`},{quoted:m}); try{let r=await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'); p.email=r.data[0]; p.points--; return sock.sendMessage(from,{text:`✅ ${p.email} Left ${p.points}`},{quoted:m});}catch{return sock.sendMessage(from,{text:`❌ Try again`},{quoted:m});}}
   if(lower==='.getotp'){let p=tempPoints[sender]; if(!p?.email) return sock.sendMessage(from,{text:`❌ First.genmail`},{quoted:m}); try{let [l,d]=p.email.split('@'); let r=await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${l}&domain=${d}`); if(!r.data.length) return sock.sendMessage(from,{text:`📭 No OTP`},{quoted:m}); let id=r.data[0].id; let r2=await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${l}&domain=${d}&id=${id}`); return sock.sendMessage(from,{text:`🔑 ${r2.data.subject}\n${r2.data.textBody}`},{quoted:m});}catch{return sock.sendMessage(from,{text:`❌ Fail`},{quoted:m});}}
   if(lower==='.settings'){settingsAuth[sender]="waiting"; return sock.sendMessage(from,{text:`🔐 Send Password`},{quoted:m});}
   if(settingsAuth[sender]==="waiting"&&msg.trim()===PAIRING_PASSWORD){settingsAuth[sender]=true; return sock.sendMessage(from,{text:`✅ Granted`},{quoted:m});}
  }catch(e){console.log(e);}
 });
}

app.get('/', (req,res)=>{
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BOT</title>
 <style>
 body{margin:0;background:#080011;color:#fff;font-family:system-ui;display:flex;justify-content:center;padding:14px}
.card{width:100%;max-width:380px;background:#13002e;border:1.8px solid #a855f7;border-radius:26px;padding:20px;text-align:center;box-shadow:0 0 45px #a855f766}
.logo-box{width:108px;height:108px;margin:8px auto 12px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#1a0040,#0f002a);border:2px solid #a855f7;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;box-shadow:0 0 25px #a855f7}
.logo-box::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:#ec4899;border-right-color:#a855f7}
.logo-box.flowing::after{animation:currentSpin 0.5s linear infinite}.logo-box.flowing{box-shadow:0 0 50px #ec4899,0 0 85px #a855f7;transform:scale(1.08)}
 @keyframes currentSpin{to{transform:rotate(360deg)}}.bolt{font-size:48px}
.server{color:#22c55e;font-weight:800;font-size:15px;margin-bottom:14px}.server.gen{color:#facc15}
.rule{background:#1a0a33;border-radius:16px;padding:13px;text-align:left;font-size:13px;line-height:1.6;border:1px solid #2b1a55;color:#e9d5ff}
 select{width:100%;padding:14px;margin-top:12px;border-radius:14px;border:1.5px solid #a855f7;background:#0d0022;color:#fff;box-sizing:border-box}
.input-wrap{position:relative;margin-top:12px}.input-wrap input{width:100%;padding:14px 45px 14px 85px;border-radius:14px;border:1.5px solid #a855f7;background:#0d0022;color:#fff;box-sizing:border-box;font-size:15px}
.cc-label{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#a78bfa;font-weight:bold;border-right:1px solid #a855f755;padding-right:10px}
.indicator{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:18px}
.btn{width:100%;padding:15px;margin-top:12px;border-radius:14px;border:none;background:linear-gradient(90deg,#a855f7,#ec4899);color:#fff;font-weight:800;font-size:15px;cursor:pointer}
.pair-box{margin-top:16px;background:#111;padding:12px;border-radius:14px;display:none}
.pair-chars{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}.char{width:38px;height:48px;background:#222;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;letter-spacing:1px}
.qr-box{margin-top:20px;background:#fff;padding:12px;border-radius:16px;display:none}.qr-box img{width:100%;max-width:260px}
.contact-btn{display:block;margin-top:18px;background:#1a0a33;border:1.5px solid #a855f7;color:#e9d5ff;padding:12px;border-radius:12px;text-decoration:none;font-size:13px}
.footer{margin-top:14px;font-size:11px;color:#a78bfa;border-top:1px dashed #a855f755;padding-top:10px}
 </style></head><body><div class="card">
 <div id="flowLogo" class="logo-box" onclick="generateAll()"><span class="bolt">⚡</span></div>
 <div id="serverText" class="server">● SERVER ONE - Active</div>
 <div class="rule"><b>⚡ Quick Setup Rules:</b><br>1. Country select koro - BD first<br>2. WhatsApp number daw - plus chara<br>3. Generate e click - Logo flow hobe<br>4. WhatsApp > Linked Devices > Link with phone number<br>5. Pair code bosao - Fast pairing</div>
 <select id="country" onchange="updateCC()"><option value="880" selected>🇧🇩 Bangladesh +880</option><option value="92">🇵🇰 Pakistan +92</option><option value="91">🇮🇳 India +91</option><option value="1">🇺🇸 America +1</option><option value="44">🇬🇧 London +44</option><option value="966">🇸🇦 Saudi +966</option><option value="975">🇧🇹 Bhutan +975</option><option value="971">🇦🇪 UAE +971</option><option value="60">🇲🇾 Malaysia +60</option></select>
 <div class="input-wrap"><span id="ccLabel" class="cc-label">+880 |</span><input id="number" type="text" placeholder="01XXXXXXXXX" oninput="validateNum()"/><span id="indicator" class="indicator"></span></div>
 <button class="btn" onclick="generateAll()">Generate Pair & QR Code</button>
 <div id="pairBox" class="pair-box"><div id="pairChars" class="pair-chars"></div><div style="margin-top:8px"><button onclick="copyCode()" style="background:#a855f7;border:none;color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer">📋 Copy</button></div></div>
 <div id="qrBox" class="qr-box"></div>
 <a id="contactBtn" href="${SELLER_CONTACT_LINK}" target="_blank" class="contact-btn">📞 If you connected via my ID, contact seller - Click Here</a>
 <div class="footer">@2026 Programmer Mahir<br>Powered by Mahir - Full Brain Edition</div>
 </div>
 <script>
 let currentCode='';
 function updateCC(){let cc=document.getElementById('country').value; document.getElementById('ccLabel').innerText='+'+cc+' |'; validateNum();}
 function validateNum(){let n=document.getElementById('number').value.replace(/[^0-9]/g,''); let ind=document.getElementById('indicator'); if(n.length>=10 && n.length<=11){ ind.innerText='✅'; ind.style.color='#22c55e'; } else if(n.length>0){ ind.innerText='❌'; ind.style.color='#ef4444'; } else { ind.innerText=''; } }
 function copyCode(){ if(currentCode){ navigator.clipboard.writeText(currentCode); alert('Copied: '+currentCode); } }
 let t=null;
 async function generateAll(){
  let logo=document.getElementById('flowLogo'); let srv=document.getElementById('serverText');
  logo.classList.add('flowing'); srv.classList.add('gen'); srv.innerText='● Generating... ⚡';
  let num=document.getElementById('number').value.replace(/[^0-9]/g,''); let cc=document.getElementById('country').value;
  if(num.startsWith('0')) num=num.substring(1); let full=cc+num;
  document.getElementById('pairBox').style.display='none'; document.getElementById('qrBox').style.display='none';
  if(full.length>=10){
   try{ let r=await fetch('/pair?number='+full); let d=await r.json();
    if(d.code){ currentCode=d.code; let box=document.getElementById('pairChars'); box.innerHTML=''; d.code.split('').forEach(ch=>{ let s=document.createElement('div'); s.className='char'; s.innerText=ch; if(ch=='-'){ s.style.background='transparent'; s.style.width='12px'; } box.appendChild(s); }); document.getElementById('pairBox').style.display='block'; }
   }catch{}
  }
  if(t) clearInterval(t); t=setInterval(async()=>{ try{ let r=await fetch('/qr'); let d=await r.json(); if(d.qr){ document.getElementById('qrBox').innerHTML='<img src=\"'+d.qr+'\">'; document.getElementById('qrBox').style.display='block'; } }catch{} },1800);
  setTimeout(()=>{ logo.classList.remove('flowing'); srv.classList.remove('gen'); srv.innerText='● SERVER ONE - Active'; },10000);
 } updateCC();
 </script></body></html>`);
});

app.get('/qr',(req,res)=> res.json({qr:latestQR||null}));
app.get('/pair', async(req,res)=>{
 try{
  let number=(req.query.number||'').replace(/[^0-9]/g,''); if(!number) return res.json({error:"Number missing"});
  const { state, saveCreds } = await useMultiFileAuthState('temp_pair_auth');
  const { version } = await fetchLatestBaileysVersion();
  const pairSock = makeWASocket({version, auth:{creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys,P().child({level:"fatal"}))}, logger:P({level:"silent"}), browser:["Chrome","Chrome","1.0.0"]});
  pairSock.ev.on('creds.update', saveCreds);
  await new Promise(r=>setTimeout(r,2500));
  if(!pairSock.authState.creds.registered){ let code=await pairSock.requestPairingCode(number); res.json({code}); setTimeout(()=>{try{pairSock.end();}catch{}},120000); }
  else { res.json({error:"Already paired"}); }
 }catch(e){ res.json({error:"Failed - retry"}); }
});
app.listen(PORT,()=>console.log("AFO FINAL "+PORT));
startBot();
