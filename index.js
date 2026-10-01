// @2026 Programmer Mahir - AFO BOT - CURRENT EDITION - FINAL
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

// ============ YAHAN APNA SETUP KARO - KHALI JAGAH ============
const CONTACT_WEBSITE = "YAHAN APNA WEBSITE LINK DALO";
const CONTACT_FB = "YAHAN APNA FB LINK DALO";
const CONTACT_EMAIL = "YAHAN APNA EMAIL DALO";
const CONTACT_WHATSAPP = "YAHAN APNA WHATSAPP LINK DALO";
const GROUP_1_NAME = "YAHAN GROUP 1 NAME DALO"; const GROUP_1_LINK = "YAHAN GROUP 1 LINK DALO";
const GROUP_2_NAME = "YAHAN GROUP 2 NAME DALO"; const GROUP_2_LINK = "YAHAN GROUP 2 LINK DALO";
const ANIME_NH_LINK = "YAHAN ANIME NH LINK DALO";

app.use('/IMG', express.static(path.join(__dirname, 'IMG')));

let tempPoints={}, connectedUsers={}, settingsAuth={}, globalSock=null, latestQR=null;
function checkPoints(s){let n=Date.now(); if(!tempPoints[s]||n-tempPoints[s].lastReset>86400000) tempPoints[s]={points:3,lastReset:n,email:null}; return tempPoints[s];}

const premiumMenu = `╭━━━〔 🌸 AFO BOT PREMIUM 〕━━━╮
┃.menu.ping.bot.info
┃.contact.group.owner
┃.yt.fb.tiktok.ig.download
┃.afo_ai.genpic.weather.time
┃.anime_sub.anime_nh
┃.temp_mail.genmail.getotp
┃.bomber.wab.sms.number
╰━━━━━━━━━━━━━━━━━━╯`;

async function geminiAsk(p){try{if(!GEMINI_API_KEY) return "❌ Set GEMINI_API_KEY in Render Env"; let u=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`; let r=await axios.post(u,{contents:[{parts:[{text:p}]}]}); return r.data.candidates?.[0]?.content?.parts?.[0]?.text||"No reply";}catch{return "❌ AI Error";}}

async function startBot(){
 const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
 const { version } = await fetchLatestBaileysVersion();
 const sock = makeWASocket({version, auth:{creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys,P().child({level:"fatal"}))}, logger:P({level:"silent"}), browser:["AFO Bot","Chrome","1.0.0"]});
 globalSock=sock;
 sock.ev.on('creds.update', saveCreds);
 sock.ev.on('connection.update', async(u)=>{
  if(u.qr){ latestQR = await qrcode.toDataURL(u.qr,{color:{dark:"#000000",light:"#FFFFFF"},width:320}); console.log("QR Ready - Full White"); }
  if(u.connection==='close'&&u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot();
 });
 sock.ev.on('messages.upsert', async({messages})=>{
  try{
   let m=messages[0]; if(!m.message||m.key.fromMe) return;
   let from=m.key.remoteJid; let sender=m.key.participant||from;
   let msg=m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||""; let lower=msg.toLowerCase().trim();
   connectedUsers[sender]={name:m.pushName||sender.split('@')[0],jid:sender,lastCommand:lower,lastSeen:new Date().toLocaleString()};

   if(lower==='.menu'){
    let imgPath = path.join(__dirname,'IMG'); let files=[]; try{ files=fs.readdirSync(imgPath).filter(f=>f.endsWith('.jpg')||f.endsWith('.png')); }catch{}
    let imgUrl = files.length>0? `file://${path.join(imgPath,files[0])}` : null;
    if(files.length>0 && fs.existsSync(path.join(imgPath,files[0]))){
     await sock.sendMessage(from,{image:fs.readFileSync(path.join(imgPath,files[0])),caption:premiumMenu},{quoted:m});
    } else {
     await sock.sendMessage(from,{image:{url:"https://i.ibb.co/3m1yK7g/anime-girl.jpg"},caption:premiumMenu},{quoted:m});
    }
    return;
   }
   if(lower==='.ping') return sock.sendMessage(from,{text:`🏓 Pong! Fast`},{quoted:m});
   if(lower==='.bot') return sock.sendMessage(from,{text:`🤖 AFO BOT - Pair OK - QR White OK - Users ${Object.keys(connectedUsers).length}`},{quoted:m});
   if(lower==='.contact') return sock.sendMessage(from,{text:`📞 ${CONTACT_WEBSITE}\n${CONTACT_FB}\n${CONTACT_EMAIL}\n${CONTACT_WHATSAPP}`},{quoted:m});
   if(lower==='.group') return sock.sendMessage(from,{text:`👥 ${GROUP_1_NAME} - ${GROUP_1_LINK}\n${GROUP_2_NAME} - ${GROUP_2_LINK}`},{quoted:m});
   if(lower==='.anime_sub') return sock.sendMessage(from,{text:`🌸 Crunchyroll\nShared 1M 100 6M 550 1Y 900\nPersonal 1M 190 6M 810 1Y 1140`},{quoted:m});
   if(lower==='.temp_mail'){let p=checkPoints(sender); return sock.sendMessage(from,{text:`📧 Points ${p.points}/3 Email ${p.email||'Empty'}`},{quoted:m});}
   if(lower==='.genmail'){let p=checkPoints(sender); if(p.points<=0) return sock.sendMessage(from,{text:`❌ 0 Points`},{quoted:m}); try{let r=await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1'); p.email=r.data[0]; p.points--; return sock.sendMessage(from,{text:`✅ ${p.email} Left ${p.points}`},{quoted:m});}catch{return sock.sendMessage(from,{text:`❌ Try again`},{quoted:m});}}
   if(lower==='.getotp'){let p=tempPoints[sender]; if(!p?.email) return sock.sendMessage(from,{text:`❌ First.genmail`},{quoted:m}); try{let [l,d]=p.email.split('@'); let r=await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${l}&domain=${d}`); if(!r.data.length) return sock.sendMessage(from,{text:`📭 No OTP yet`},{quoted:m}); let id=r.data[0].id; let r2=await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${l}&domain=${d}&id=${id}`); return sock.sendMessage(from,{text:`🔑 ${r2.data.subject}\n${r2.data.textBody}`},{quoted:m});}catch{return sock.sendMessage(from,{text:`❌ Fail`},{quoted:m});}}
   if(lower==='.settings'){settingsAuth[sender]="waiting"; return sock.sendMessage(from,{text:`🔐 Send Password`},{quoted:m});}
   if(settingsAuth[sender]==="waiting"&&msg.trim()===PAIRING_PASSWORD){settingsAuth[sender]=true; return sock.sendMessage(from,{text:`✅ Granted -.users.broadcast <msg>`},{quoted:m});}
   if(lower==='.users'&&settingsAuth[sender]===true){let list=Object.values(connectedUsers).map((u,i)=>`${i+1}. ${u.name} ${u.jid}`).join('\n'); return sock.sendMessage(from,{text:`📊 ${list}`},{quoted:m});}
   if(lower.startsWith('.broadcast ')&&settingsAuth[sender]===true){let b=msg.slice(11); for(let j in connectedUsers){try{await sock.sendMessage(j,{text:`📢 ${b}`});}catch{}} return sock.sendMessage(from,{text:`✅ Done`},{quoted:m});}
   if(lower==='.bomber') return sock.sendMessage(from,{text:`💣 Safe Placeholder -.wab.sms.number - Coming Soon`},{quoted:m});
   if(lower.startsWith('.wab')||lower.startsWith('.sms')||lower.startsWith('.number')) return sock.sendMessage(from,{text:`💣 Safe Placeholder - Coming Soon`},{quoted:m});
   if(lower.startsWith('.afo_ai ')){let a=await geminiAsk(msg.slice(8)); return sock.sendMessage(from,{text:a},{quoted:m});}
  }catch(e){console.log(e);}
 });
}

app.get('/', (req,res)=>{
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BOT</title>
 <style>
 body{margin:0;background:#080011;color:#fff;font-family:system-ui;display:flex;justify-content:center;padding:16px}
.card{width:100%;max-width:380px;background:#13002e;border:1.8px solid #a855f7;border-radius:26px;padding:22px;text-align:center;box-shadow:0 0 45px #a855f766}
 /* CURRENT LOGO */
.logo-box{width:108px;height:108px;margin:8px auto 12px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#1a0040,#0f002a);border:2px solid #a855f7;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;box-shadow:0 0 25px #a855f7, inset 0 0 18px #a855f733;transition:0.3s}
.logo-box::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:3px solid transparent;border-top-color:#ec4899;border-right-color:#a855f7;filter:drop-shadow(0 0 8px #ec4899);opacity:0.9}
.logo-box.flowing::after{animation:currentSpin 0.5s linear infinite}
.logo-box.flowing{box-shadow:0 0 50px #ec4899,0 0 85px #a855f7;transform:scale(1.08)}
 @keyframes currentSpin{to{transform:rotate(360deg)}}
.bolt{font-size:48px;filter:drop-shadow(0 0 12px #fff);animation:zap 1.2s infinite alternate}
 @keyframes zap{from{transform:scale(1)}to{transform:scale(1.18);text-shadow:0 0 18px #fff}}
.server{color:#22c55e;font-weight:800;font-size:15px;margin-bottom:14px;letter-spacing:0.3px}
.server.gen{color:#facc15;animation:pulse 0.8s infinite alternate}
 @keyframes pulse{from{opacity:0.6}to{opacity:1}}
.rule{background:#1a0a33;border-radius:16px;padding:13px;text-align:left;font-size:13px;line-height:1.6;border:1px solid #2b1a55;color:#e9d5ff}
 select,input{width:100%;padding:14px;margin-top:12px;border-radius:14px;border:1.5px solid #a855f7;background:#0d0022;color:#fff;font-size:14px;box-sizing:border-box;outline:none}
.btn{width:100%;padding:15px;margin-top:12px;border-radius:14px;border:none;background:linear-gradient(90deg,#a855f7,#ec4899);color:#fff;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 6px 22px #a855f788}
 #result{margin-top:12px;font-size:22px;letter-spacing:4px;color:#f5e6ff;font-weight:900;min-height:28px}
 #qrBox img{width:100%;max-width:255px;background:#fff;padding:12px;border-radius:14px;margin-top:10px}
.footer{margin-top:14px;font-size:11px;color:#a78bfa;border-top:1px dashed #a855f755;padding-top:10px;line-height:1.5}
 </style></head><body><div class="card">
 <div id="flowLogo" class="logo-box" onclick="generateAll()"><span class="bolt">⚡</span></div>
 <div id="serverText" class="server">● SERVER ONE - Active</div>
 <div class="rule"><b>⚡ Quick Setup Rules:</b><br>1. Country select koro - BD first e ache<br>2. WhatsApp number daw - plus chara<br>3. Generate button e click koro - Logo te current flow hobe<br>4. WhatsApp > Linked Devices > Link with phone number<br>5. Pair code bosao - Fast pairing, no error</div>
 <select id="country" onchange="up()"><option value="880" selected>🇧🇩 Bangladesh +880</option><option value="92">🇵🇰 Pakistan +92</option><option value="91">🇮🇳 India +91</option><option value="1">🇺🇸 America +1</option><option value="44">🇬🇧 London +44</option><option value="966">🇸🇦 Saudi +966</option><option value="975">🇧🇹 Bhutan +975</option><option value="971">🇦🇪 UAE +971</option><option value="60">🇲🇾 Malaysia +60</option></select>
 <input id="number" type="text" placeholder="Enter number for +880"/>
 <button class="btn" onclick="generateAll()">Generate Pair & QR Code</button>
 <div id="result"></div><div id="qrBox"></div>
 <div class="footer">@2026 Programmer Mahir<br>Powered by Mahir - Current Flow Edition</div>
 </div>
 <script>
 function up(){let c=document.getElementById('country').value; document.getElementById('number').placeholder='Enter number for +'+c;}
 let t=null; async function generateAll(){
  let logo=document.getElementById('flowLogo'); let srv=document.getElementById('serverText');
  logo.classList.add('flowing'); srv.classList.add('gen'); srv.innerText='● Generating Pair & QR... ⚡';
  let num=document.getElementById('number').value.replace(/[^0-9]/g,''); let cc=document.getElementById('country').value;
  if(num.startsWith('0')) num=num.substring(1); let full=cc+num;
  document.getElementById('result').innerText='Generating...'; document.getElementById('qrBox').innerHTML='<p style=color:#a78bfa>Loading Full White QR...</p>';
  if(full.length>=10){try{let r=await fetch('/pair?number='+full); let d=await r.json(); document.getElementById('result').innerText=d.code||d.error||'Error';}catch{document.getElementById('result').innerText='Pair Busy - Use QR';}} else {document.getElementById('result').innerText='Enter Number First';}
  if(t) clearInterval(t); t=setInterval(async()=>{try{let r=await fetch('/qr'); let d=await r.json(); if(d.qr) document.getElementById('qrBox').innerHTML='<img src=\"'+d.qr+'\">';}catch{}},1800);
  setTimeout(()=>{logo.classList.remove('flowing'); srv.classList.remove('gen'); srv.innerText='● SERVER ONE - Active';},10000);
 } up();
 </script></body></html>`);
});
app.get('/qr',(req,res)=> res.json({qr:latestQR||null}));
app.get('/pair', async(req,res)=>{
 try{
  let number=(req.query.number||'').replace(/[^0-9]/g,''); if(!number) return res.json({error:"Number missing"});
  if(!globalSock) return res.json({error:"Bot Starting - Wait 10s"});
  let code = await globalSock.requestPairingCode(number);
  res.json({code: code.match(/.{1,4}/g).join('-')});
 }catch(e){ console.log(e.message); res.json({error:"Failed - Use Full White QR Below"}); }
});
app.listen(PORT,()=>console.log("✅ AFO BOT CURRENT Running "+PORT));
startBot();
