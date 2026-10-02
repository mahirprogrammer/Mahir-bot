// @2026 Programmer Mahir - AFO BOT - DARK PURPLE + LOGGING FIX - FINAL
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

// ============ CONTACT LINK - KHALI JAGAH ============
const SELLER_CONTACT_LINK = "https://wa.me/8801911575104"; // Yahan apna link dalo

app.use('/IMG', express.static(path.join(__dirname, 'IMG')));
let tempPoints={}, connectedUsers={}, globalSock=null, latestQR=null;
function checkPoints(s){let n=Date.now(); if(!tempPoints[s]||n-tempPoints[s].lastReset>86400000) tempPoints[s]={points:3,lastReset:n,email:null}; return tempPoints[s];}

const premiumMenu = `╭━━━〔 🌸 AFO BOT PREMIUM 〕━━━╮
┃.menu.ping.bot.info.owner
┃.contact.group.yt.fb.tiktok
┃.afo_ai.genpic.anime_sub
┃.temp_mail.genmail.getotp
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
    printQRInTerminal:false
 });
 globalSock=sock;
 sock.ev.on('creds.update', saveCreds);
 sock.ev.on('connection.update', async(u)=>{
  if(u.qr){
    latestQR = await qrcode.toDataURL(u.qr,{color:{dark:"#000000",light:"#FFFFFF"},width:400, margin:1});
    console.log("QR Generated - Full White");
  }
  if(u.connection==='open'){ console.log("✅ BOT CONNECTED SUCCESSFULLY"); latestQR=null; }
  if(u.connection==='close'){
    let shouldReconnect = u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut;
    if(shouldReconnect) startBot();
  }
 });
 sock.ev.on('messages.upsert', async({messages})=>{
  try{
   let m=messages[0]; if(!m.message||m.key.fromMe) return;
   let from=m.key.remoteJid; let sender=m.key.participant||from;
   let msg=m.message.conversation||m.message.extendedTextMessage?.text||""; let lower=msg.toLowerCase().trim();
   connectedUsers[sender]={name:m.pushName||sender.split('@')[0],jid:sender};
   if(lower==='.menu'){
    let imgPath=path.join(__dirname,'IMG'); try{let files=fs.readdirSync(imgPath).filter(f=>f.endsWith('.jpg')||f.endsWith('.png')); if(files.length>0){await sock.sendMessage(from,{image:fs.readFileSync(path.join(imgPath,files[0])),caption:premiumMenu},{quoted:m}); return;}}catch{}
    await sock.sendMessage(from,{text:premiumMenu},{quoted:m}); return;
   }
   if(lower==='.ping') return sock.sendMessage(from,{text:`🏓 Pong Fast`},{quoted:m});
   if(lower.startsWith('.afo_ai ')){let a=await geminiAsk(msg.slice(8)); return sock.sendMessage(from,{text:a},{quoted:m});}
  }catch{}
 });
}

app.get('/', (req,res)=>{
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>AFO BOT - Dark Purple</title>
 <style>
 body{margin:0;background:#07000f;color:#fff;font-family:system-ui;display:flex;justify-content:center;padding:14px}
.card{width:100%;max-width:380px;background:#14002a;border:1.8px solid #7c3aed;border-radius:26px;padding:20px;text-align:center;box-shadow:0 0 50px #7c3aed55}
.logo-box{width:110px;height:110px;margin:8px auto 12px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#2a0a5c,#14002a);border:2px solid #a855f7;display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;box-shadow:0 0 30px #7c3aed}
.logo-box::after{content:'';position:absolute;inset:-5px;border-radius:50%;border:3px solid transparent;border-top-color:#ec4899;border-right-color:#7c3aed;opacity:0.9}
.logo-box.flowing::after{animation:spin 0.6s linear infinite}.logo-box.flowing{box-shadow:0 0 60px #ec4899;transform:scale(1.08)}
@keyframes spin{to{transform:rotate(360deg)}}.bolt{font-size:52px;filter:drop-shadow(0 0 10px #fff)}
.server{color:#22c55e;font-weight:800;font-size:14px;margin-bottom:14px}.server.gen{color:#facc15}
.rule{background:#1e0a3a;border-radius:16px;padding:13px;text-align:left;font-size:13px;line-height:1.6;border:1px solid #3b1f6e;color:#d8b4fe}
select{width:100%;padding:14px;margin-top:12px;border-radius:14px;border:1.5px solid #7c3aed;background:#0e0020;color:#fff;box-sizing:border-box}
.input-wrap{position:relative;margin-top:12px}.input-wrap input{width:100%;padding:14px 45px 14px 88px;border-radius:14px;border:1.5px solid #7c3aed;background:#0e0020;color:#fff;box-sizing:border-box;font-size:15px;outline:none}
.cc-label{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#a78bfa;font-weight:bold;border-right:1px solid #7c3aed55;padding-right:10px}
.indicator{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:18px}
.btn{width:100%;padding:15px;margin-top:14px;border-radius:14px;border:none;background:linear-gradient(90deg,#7c3aed,#ec4899);color:#fff;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 6px 22px #7c3aed88}
.pair-box{margin-top:16px;background:#0e0020;padding:14px;border-radius:14px;display:none;border:1px solid #7c3aed55}
.pair-chars{display:flex;justify-content:center;gap:6px;flex-wrap:wrap}.char{width:40px;height:50px;background:#1e0a3a;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;border:1px solid #7c3aed44}
.qr-box{margin-top:22px;background:#ffffff;padding:14px;border-radius:16px;display:none}.qr-box img{width:100%;max-width:270px}
.contact-btn{display:block;margin-top:18px;background:#1e0a3a;border:1.5px solid #7c3aed;color:#d8b4fe;padding:12px;border-radius:12px;text-decoration:none;font-size:13px}
.footer{margin-top:14px;font-size:11px;color:#a78bfa;border-top:1px dashed #7c3aed55;padding-top:10px}
 </style></head><body><div class="card">
 <div id="flowLogo" class="logo-box" onclick="generateAll()"><span class="bolt">⚡</span></div>
 <div id="serverText" class="server">● SERVER ONE - Active</div>
 <div class="rule"><b>⚡ Quick Setup Rules:</b><br>1. Country select koro - BD first<br>2. WhatsApp number daw - 0 chara<br>3. Generate e click - Logo flow hobe<br>4. WhatsApp > Linked Devices > Link with phone number<br>5. Pair code 20 sec er moddhe bosao</div>
 <select id="country" onchange="updateCC()"><option value="880" selected>🇧🇩 Bangladesh +880</option><option value="92">🇵🇰 Pakistan +92</option><option value="91">🇮🇳 India +91</option><option value="1">🇺🇸 America +1</option><option value="44">🇬🇧 London +44</option><option value="966">🇸🇦 Saudi +966</option><option value="975">🇧🇹 Bhutan +975</option><option value="971">🇦🇪 UAE +971</option><option value="60">🇲🇾 Malaysia +60</option></select>
 <div class="input-wrap"><span id="ccLabel" class="cc-label">+880 |</span><input id="number" type="text" placeholder="01XXXXXXXXX" oninput="validateNum()"/><span id="indicator" class="indicator"></span></div>
 <button class="btn" onclick="generateAll()">Generate Pair & QR Code</button>
 <div id="pairBox" class="pair-box"><div id="pairChars" class="pair-chars"></div><div style="margin-top:10px"><button onclick="copyCode()" style="background:#7c3aed;border:none;color:#fff;padding:7px 16px;border-radius:8px;cursor:pointer">📋 Copy Code</button></div></div>
 <div id="qrBox" class="qr-box"></div>
 <a href="${SELLER_CONTACT_LINK}" target="_blank" class="contact-btn">📞 If connected via my ID, contact seller - Click Here</a>
 <div class="footer">@2026 Programmer Mahir<br>Powered by Mahir - Dark Purple</div>
 </div>
 <script>
 let currentCode='';
 function updateCC(){let cc=document.getElementById('country').value; document.getElementById('ccLabel').innerText='+'+cc+' |'; validateNum();}
 function validateNum(){let n=document.getElementById('number').value.replace(/[^0-9]/g,''); let ind=document.getElementById('indicator'); if(n.length>=10 && n.length<=11){ ind.innerText='✅'; } else if(n.length>0){ ind.innerText='❌'; } else { ind.innerText=''; } }
 function copyCode(){ if(currentCode){ navigator.clipboard.writeText(currentCode); alert('Copied: '+currentCode); } }
 let t=null;
 async function generateAll(){
  let logo=document.getElementById('flowLogo'); let srv=document.getElementById('serverText');
  logo.classList.add('flowing'); srv.classList.add('gen'); srv.innerText='● Generating... ⚡';
  let num=document.getElementById('number').value.replace(/[^0-9]/g,''); let cc=document.getElementById('country').value;
  if(num.startsWith('0')) num=num.substring(1); let full=cc+num;
  document.getElementById('pairBox').style.display='none'; document.getElementById('qrBox').style.display='none';
  document.getElementById('pairChars').innerHTML='Generating...';
  if(full.length>=10){
   document.getElementById('pairBox').style.display='block';
   try{ let r=await fetch('/pair?number='+full); let d=await r.json();
    if(d.code){ currentCode=d.code; let box=document.getElementById('pairChars'); box.innerHTML=''; d.code.split('').forEach(ch=>{ let s=document.createElement('div'); s.className='char'; s.innerText=ch; if(ch=='-'){ s.style.background='transparent'; s.style.border='none'; s.style.width='10px'; } box.appendChild(s); }); }
    else { document.getElementById('pairChars').innerText=d.error||'Error'; }
   }catch{ document.getElementById('pairChars').innerText='Error - Retry'; }
  }
  if(t) clearInterval(t); t=setInterval(async()=>{ try{ let r=await fetch('/qr'); let d=await r.json(); if(d.qr){ document.getElementById('qrBox').innerHTML='<img src=\"'+d.qr+'\">'; document.getElementById('qrBox').style.display='block'; } }catch{} },1500);
  setTimeout(()=>{ logo.classList.remove('flowing'); srv.classList.remove('gen'); srv.innerText='● SERVER ONE - Active'; },12000);
 } updateCC();
 </script></body></html>`);
});

app.get('/qr',(req,res)=> res.json({qr:latestQR||null}));

// ==== FIXED PAIRING - SINGLE AUTH - NO TEMP FOLDER ====
app.get('/pair', async(req,res)=>{
 try{
  let number=(req.query.number||'').replace(/[^0-9]/g,'');
  if(!number || number.length < 10) return res.json({error:"Enter full number"});
  if(!globalSock){ return res.json({error:"Bot starting - wait 8 sec & retry"}); }
  if(globalSock.authState.creds.registered){ return res.json({error:"Already logged in - Delete auth_info_baileys in Render"}); }

  console.log("Requesting Pair Code for", number);
  let code = await globalSock.requestPairingCode(number);
  console.log("Pair Code:", code);
  res.json({code: code});

 }catch(e){
  console.log("Pair Error:", e.message);
  // Important: if 401 or conflict, reset auth
  if(e.message.includes('conflict') || e.message.includes('already')){
    res.json({error:"Already linked - Go to Render > Delete auth folder"});
  } else {
    res.json({error:"Try again after 10 sec - "+e.message});
  }
 }
});

app.listen(PORT,()=>console.log("DARK PURPLE BOT RUNNING "+PORT));
startBot();
