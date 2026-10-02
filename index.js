// @2026 Programmer Mahir - FINAL DARK PURPLE + LIVE TIME + FULL BRAIN
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

const SELLER_CONTACT_LINK = "https://wa.me/8801911575104"; // Yahan link dalo bhai
const CONTACT_WEBSITE = "afo-bot.com";
const CONTACT_FB = "fb.com/mahir";
const CONTACT_EMAIL = "mahir@afo.com";

app.use('/IMG', express.static(path.join(__dirname, 'IMG')));
let tempPoints={}, connectedUsers={}, globalSock=null, latestQR=null, connectedAt=null, connectedNumber=null;

function checkPoints(s){let n=Date.now(); if(!tempPoints[s]||n-tempPoints[s].lastReset>86400000) tempPoints[s]={points:3,lastReset:n,email:null}; return tempPoints[s];}
function bdTime(){ return new Date().toLocaleString('en-BD',{timeZone:'Asia/Dhaka',hour12:true,hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'short',year:'numeric'}); }

const premiumMenu = `╭━━━〔 🤖 AFO BOT 🤖 〕━━━╮
┃ 🤖 All Commands Active
┃
┃.menu - Show Menu with Image
┃.ping - Speed Check
┃.bot - Bot Status & Users
┃.info - Bot Info + Live Time + Seller
┃.owner - Owner Info
┃.contact - Seller Contact If ID Connected
┃.group - Group Links
┃.afo_ai <text> - AI Chat
┃.genpic <text> - Image Gen
┃.temp_mail - Check Mail Points
┃.genmail - Generate Temp Mail
┃.getotp - Get OTP from Mail
┃.download - Download Help
┃ 📞 If connected via my ID, contact seller
┃ 🕒 Live Time: ${bdTime()}
╰━━━━━━━━━━━━━━━━━━╯`;

async function geminiAsk(p){try{if(!GEMINI_API_KEY) return "❌ Set GEMINI_API_KEY"; let u=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`; let r=await axios.post(u,{contents:[{parts:[{text:p}]}]}); return r.data.candidates?.[0]?.content?.parts?.[0]?.text||"No reply";}catch{return "❌ AI Error";}}

async function startBot(){
 const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
 const { version } = await fetchLatestBaileysVersion();
 const sock = makeWASocket({
    version,
    auth:{creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys,P().child({level:"fatal"}))},
    logger:P({level:"silent"}),
    browser:["Ubuntu","Chrome","20.0.04"],
 });
 globalSock=sock;
 sock.ev.on('creds.update', saveCreds);
 sock.ev.on('connection.update', async(u)=>{
  if(u.qr){ latestQR = await qrcode.toDataURL(u.qr,{color:{dark:"#000000",light:"#FFFFFF"},width:400,margin:1}); }
  if(u.connection==='open'){
    connectedAt = new Date();
    console.log("✅ CONNECTED at", bdTime());
    latestQR=null;
  }
  if(u.connection==='close'){
    let shouldReconnect = u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut;
    if(shouldReconnect) startBot(); else { connectedAt=null; connectedNumber=null; }
  }
 });
 sock.ev.on('messages.upsert', async({messages})=>{
  try{
   let m=messages[0]; if(!m.message||m.key.fromMe) return;
   let from=m.key.remoteJid; let sender=m.key.participant||from;
   let msg=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||""; let lower=msg.toLowerCase().trim();
   connectedUsers[sender]=true;
   if(lower==='.menu'){
    let imgPath=path.join(__dirname,'IMG'); try{let files=fs.readdirSync(imgPath).filter(f=>f.endsWith('.jpg')||f.endsWith('.png')); if(files.length>0){await sock.sendMessage(from,{image:fs.readFileSync(path.join(imgPath,files[0])),caption:premiumMenu},{quoted:m}); return;}}catch{}
    await sock.sendMessage(from,{text:premiumMenu},{quoted:m}); return;
   }
   if(lower==='.ping') return sock.sendMessage(from,{text:`🏓 Pong! ${bdTime()}`},{quoted:m});
   if(lower==='.bot') return sock.sendMessage(from,{text:`🤖 AFO BOT Active\n👥 Users: ${Object.keys(connectedUsers).length}\n🕒 ${bdTime()}\n${connectedAt?`✅ Connected Since: ${connectedAt.toLocaleString('en-BD',{timeZone:'Asia/Dhaka'})}`:'❌ Not Connected'}`},{quoted:m});
   if(lower==='.info') return sock.sendMessage(from,{text:`╭━━━ AFO BOT INFO ━━━╮\n┃ 🤖 AFO BOT PREMIUM\n┃ 🕒 Live BD Time: ${bdTime()}\n┃ ${connectedAt?`✅ Connected: ${connectedAt.toLocaleString('en-BD',{timeZone:'Asia/Dhaka'})}\n┃ 📱 Number: ${connectedNumber||'Linked Device'}`:'❌ Not Connected'}\n┃\n┃ 📞 If connected via my ID, contact seller\n┃ 🔗 ${SELLER_CONTACT_LINK}\n┃ 🌐 ${CONTACT_WEBSITE}\n╰━━━━━━━━━━━━╯`},{quoted:m});
   if(lower==='.contact') return sock.sendMessage(from,{text:`📞 CONTACT SELLER\n\nIf connected via my ID, contact seller - Must Contact\n\n🔗 Seller: ${SELLER_CONTACT_LINK}\n🌐 Website: ${CONTACT_WEBSITE}\n📘 FB: ${CONTACT_FB}\n📧 Email: ${CONTACT_EMAIL}\n🕒 Time: ${bdTime()}\n\n⚠️ Bot connected? Contact now!`},{quoted:m});
   if(lower==='.owner') return sock.sendMessage(from,{text:`👑 Owner: Programmer Mahir\n📞 ${SELLER_CONTACT_LINK}\n🕒 ${bdTime()}`},{quoted:m});
   if(lower==='.group') return sock.sendMessage(from,{text:`👥 Groups\n${CONTACT_WEBSITE}`},{quoted:m});
   if(lower.startsWith('.afo_ai ')){let a=await geminiAsk(msg.slice(8)); return sock.sendMessage(from,{text:a},{quoted:m});}
   if(lower==='.temp_mail'){let p=checkPoints(sender); return sock.sendMessage(from,{text:`📧 Points ${p.points}/3 Email ${p.email||'Empty'}`},{quoted:m});}
   if(lower==='.genmail'){let p=checkPoints(sender); if(p.points<=0) return sock.sendMessage(from,{text:`❌ 0 Points`},{quoted:m}); try{let r=await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'); p.email=r.data[0]; p.points--; return sock.sendMessage(from,{text:`✅ ${p.email} Left ${p.points}`},{quoted:m});}catch{return sock.sendMessage(from,{text:`❌ Try again`},{quoted:m});}}
  }catch(e){console.log(e);}
 });
}

app.get('/', (req,res)=>{
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BOT - Dark</title>
 <style>
 body{margin:0;background:#07000f;color:#fff;font-family:system-ui;display:flex;justify-content:center;padding:14px}
.card{width:100%;max-width:380px;background:#14002a;border:1.8px solid #7c3aed;border-radius:26px;padding:20px;text-align:center;box-shadow:0 0 50px #7c3aed55}
.logo-box{width:110px;height:110px;margin:8px auto 10px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#2a0a5c,#14002a);border:2px solid #a855f7;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;box-shadow:0 0 30px #7c3aed}
.logo-box::after{content:'';position:absolute;inset:-5px;border-radius:50%;border:3px solid transparent;border-top-color:#ec4899;border-right-color:#7c3aed}
.logo-box.flowing::after{animation:spin 0.6s linear infinite}.logo-box.flowing{box-shadow:0 0 60px #ec4899;transform:scale(1.08)}
@keyframes spin{to{transform:rotate(360deg)}}.bolt{font-size:52px}
.server{color:#22c55e;font-weight:800;font-size:14px;margin-bottom:6px}.live-time{color:#d8b4fe;font-size:12px;font-weight:600;margin-bottom:10px;letter-spacing:0.5px}
.rule{background:#1e0a3a;border-radius:16px;padding:12px;text-align:left;font-size:12.5px;line-height:1.6;border:1px solid #3b1f6e;color:#d8b4fe}
select{width:100%;padding:14px;margin-top:12px;border-radius:14px;border:1.5px solid #7c3aed;background:#0e0020;color:#fff}
.input-wrap{position:relative;margin-top:12px}.input-wrap input{width:100%;padding:14px 45px 14px 88px;border-radius:14px;border:1.5px solid #7c3aed;background:#0e0020;color:#fff;box-sizing:border-box;font-size:15px;outline:none}
.cc-label{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#a78bfa;font-weight:bold;border-right:1px solid #7c3aed55;padding-right:10px}
.indicator{position:absolute;right:12px;top:50%;transform:translateY(-50%)}
.btn{width:100%;padding:15px;margin-top:14px;border-radius:14px;border:none;background:linear-gradient(90deg,#7c3aed,#ec4899);color:#fff;font-weight:800;cursor:pointer}
.pair-box{margin-top:16px;background:#0e0020;padding:14px;border-radius:14px;display:none;border:1px solid #7c3aed55}
.pair-chars{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}.char{width:40px;height:50px;background:#1e0a3a;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;border:1px solid #7c3aed44}
.qr-box{margin-top:20px;background:#fff;padding:14px;border-radius:16px;display:none}.qr-box img{width:100%;max-width:270px}
.status{margin-top:14px;background:#0e0020;border:1px solid #22c55e55;padding:10px;border-radius:12px;font-size:12px;color:#86efac;display:none}
.contact-btn{display:block;margin-top:16px;background:#1e0a3a;border:1.5px solid #7c3aed;color:#d8b4fe;padding:12px;border-radius:12px;text-decoration:none;font-size:13px}
.footer{margin-top:12px;font-size:11px;color:#a78bfa;border-top:1px dashed #7c3aed55;padding-top:10px}
 </style></head><body><div class="card">
 <div id="flowLogo" class="logo-box" onclick="generateAll()"><span class="bolt">⚡</span></div>
 <div id="serverText" class="server">● SERVER ONE - Active</div>
 <div id="liveTime" class="live-time">🕒 Loading BD Time...</div>
 <div id="connStatus" class="status"></div>
 <div class="rule"><b>⚡ Quick Setup Rules:</b><br>1. Country select koro<br>2. Number daw - 0 chara<br>3. Generate e click - Logo flow hobe<br>4. WhatsApp > Linked Devices > Link with phone number<br>5. Code 20 sec er moddhe bosao</div>
 <select id="country" onchange="updateCC()"><option value="880" selected>🇧🇩 Bangladesh +880</option><option value="92">🇵🇰 Pakistan +92</option><option value="91">🇮🇳 India +91</option><option value="1">🇺🇸 USA +1</option><option value="44">🇬🇧 UK +44</option><option value="966">🇸🇦 Saudi +966</option><option value="975">🇧🇹 Bhutan +975</option><option value="971">🇦🇪 UAE +971</option><option value="60">🇲🇾 Malaysia +60</option></select>
 <div class="input-wrap"><span id="ccLabel" class="cc-label">+880 |</span><input id="number" type="text" placeholder="01XXXXXXXXX" oninput="validateNum()"/><span id="indicator" class="indicator"></span></div>
 <button class="btn" onclick="generateAll()">Generate Pair & QR Code</button>
 <div id="pairBox" class="pair-box"><div id="pairChars" class="pair-chars"></div><div style="margin-top:10px"><button onclick="copyCode()" style="background:#7c3aed;border:none;color:#fff;padding:7px 16px;border-radius:8px;cursor:pointer">📋 Copy Code</button></div></div>
 <div id="qrBox" class="qr-box"></div>
 <a href="${SELLER_CONTACT_LINK}" target="_blank" class="contact-btn">📞 If connected via my ID, contact seller - Click Here</a>
 <div class="footer">@2026 Programmer Mahir<br>Powered by Mahir - Live Time Edition</div>
 </div>
 <script>
 let currentCode='';
 function updateCC(){let cc=document.getElementById('country').value; document.getElementById('ccLabel').innerText='+'+cc+' |';}
 function validateNum(){let n=document.getElementById('number').value.replace(/[^0-9]/g,''); let ind=document.getElementById('indicator'); if(n.length>=10){ind.innerText='✅';} else if(n.length>0){ind.innerText='❌';} else {ind.innerText='';}}
 function copyCode(){ if(currentCode){ navigator.clipboard.writeText(currentCode); alert('Copied: '+currentCode); } }
 function updateLiveTime(){ let now=new Date().toLocaleString('en-BD',{timeZone:'Asia/Dhaka',hour12:true,hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'short'}); document.getElementById('liveTime').innerText='🕒 BD Live: '+now; }
 setInterval(updateLiveTime,1000); updateLiveTime();
 async function checkStatus(){ try{let r=await fetch('/status'); let d=await r.json(); let s=document.getElementById('connStatus'); if(d.connected){ s.style.display='block'; s.innerHTML='✅ Connected: '+d.number+'<br>🕒 Since: '+d.since+'<br>⏱️ Live: '+d.live; } else { s.style.display='none'; } }catch{} }
 setInterval(checkStatus,3000); checkStatus();
 let t=null;
 async function generateAll(){
  let logo=document.getElementById('flowLogo'); let srv=document.getElementById('serverText');
  logo.classList.add('flowing'); srv.innerText='● Generating... ⚡';
  let num=document.getElementById('number').value.replace(/[^0-9]/g,''); let cc=document.getElementById('country').value;
  if(num.startsWith('0')) num=num.substring(1); let full=cc+num;
  document.getElementById('pairBox').style.display='none'; document.getElementById('qrBox').style.display='none';
  if(full.length>=10){
   document.getElementById('pairBox').style.display='block'; document.getElementById('pairChars').innerText='Generating...';
   try{ let r=await fetch('/pair?number='+full); let d=await r.json();
    if(d.code){ currentCode=d.code; let box=document.getElementById('pairChars'); box.innerHTML=''; d.code.split('').forEach(ch=>{ let s=document.createElement('div'); s.className='char'; s.innerText=ch; if(ch=='-'){ s.style.background='transparent'; s.style.border='none'; s.style.width='10px'; } box.appendChild(s); }); }
    else { document.getElementById('pairChars').innerText=d.error; }
   }catch{ document.getElementById('pairChars').innerText='Error - Retry'; }
  }
  if(t) clearInterval(t); t=setInterval(async()=>{ try{ let r=await fetch('/qr'); let d=await r.json(); if(d.qr){ document.getElementById('qrBox').innerHTML='<img src=\"'+d.qr+'\">'; document.getElementById('qrBox').style.display='block'; } }catch{} },1500);
  setTimeout(()=>{ logo.classList.remove('flowing'); srv.innerText='● SERVER ONE - Active'; },12000);
 }
 </script></body></html>`);
});

app.get('/qr',(req,res)=> res.json({qr:latestQR||null}));
app.get('/status',(req,res)=>{
 if(connectedAt){
   res.json({connected:true, number: connectedNumber||'Linked Device', since: connectedAt.toLocaleString('en-BD',{timeZone:'Asia/Dhaka'}), live: bdTime()});
 } else { res.json({connected:false, live: bdTime()}); }
});
app.get('/pair', async(req,res)=>{
 try{
  let number=(req.query.number||'').replace(/[^0-9]/g,'');
  if(!number) return res.json({error:"Enter number"});
  if(!globalSock) return res.json({error:"Bot starting - wait 10 sec"});
  if(globalSock.authState.creds.registered) return res.json({error:"Already Logged - Delete auth folder"});
  connectedNumber=number;
  let code=await globalSock.requestPairingCode(number);
  res.json({code});
 }catch(e){ res.json({error:"Failed - retry in 10s"}); }
});
app.listen(PORT,()=>console.log("DARK LIVE BOT "+PORT));
startBot();
