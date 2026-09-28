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

function getMyPhoto(){
    for(let f of ['./img','./image']){
        if(fs.existsSync(f)){
            let files = fs.readdirSync(f).filter(x=> x.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/));
            if(files.length) return path.join(f,files[0]);
        }
    }
    return null;
}
function cleanNumber(n){
    n = n.replace(/[^0-9]/g,'');
    if(n.startsWith('880880')) n=n.slice(3);
    if(n.startsWith('8800')) n='880'+n.slice(4);
    if(n.startsWith('880') && n[3]=='0') n='880'+n.slice(4);
    if(n.startsWith('0')) n=n.slice(1);
    // if still starts with 880 and next is 0 again
    if(n.startsWith('8800')) n='880'+n.slice(4);
    return n;
}

app.get('/',(req,res)=>{
res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>PROGRAMMER MAHIR</title><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Inter:wght@600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif}html,body{overflow-x:hidden;max-width:100vw}body{background:#080514;color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center}body::before{content:'';position:fixed;inset:0;z-index:-1;background:radial-gradient(600px at 50% 0%, #2a0a5a 0%, transparent 60%),#080514}.header{width:100%;max-width:500px;padding:20px 14px 10px;display:flex;flex-direction:column;align-items:center;gap:10px}.current-box{width:74px;height:74px;border-radius:50%;border:2px solid #a855f7;background:#12112a;display:grid;place-items:center;position:relative;box-shadow:0 0 18px #a855f755;overflow:hidden;cursor:pointer}.current-box::before{content:'';position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(from 0deg, transparent, #22d3ee, #a855f7, transparent);animation:rotate 1.8s linear infinite;opacity:0}.current-box.flow::before{opacity:1}.current-box::after{content:'';position:absolute;inset:3px;border-radius:50%;background:#12112a;z-index:1}.current-icon{font-size:34px;z-index:2}.badge{border:1px solid #22d3ee55;background:#0f172a;padding:7px 14px;border-radius:99px;font-size:11px;display:flex;align-items:center;gap:6px;font-weight:800}.dot{width:7px;height:7px;background:#22c55e;border-radius:50%;box-shadow:0 0 8px #22c55e;animation:blink 1.5s infinite}@keyframes rotate{to{transform:rotate(360deg)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}.container{width:100%;max-width:500px;padding:0 12px 20px;display:flex;flex-direction:column;gap:12px}.card{background:rgba(18,12,38,.97);border:1px solid #a855f744;border-radius:18px;padding:14px;box-shadow:0 0 20px #a855f722;width:100%}.quick-title{font-size:12px;font-weight:900;color:#e879f9;letter-spacing:1px;margin-bottom:8px}.quick-list{list-style:none}.quick-list li{font-size:11px;color:#c4b5fd;line-height:1.5;margin-bottom:5px;display:flex;gap:6px}.quick-list li b{color:#a5b4fc}.label{font-size:10px;color:#e879f9;background:#2a164d;padding:4px 9px;border-radius:6px;display:inline-block;margin:10px 0 6px;font-weight:800}.selectBox,.inputBox{width:100%;background:#15102a;border:1.2px solid #a855f766;border-radius:12px;padding:12px 13px;display:flex;align-items:center;gap:10px}.selectBox select,.inputBox input{flex:1;background:transparent;border:none;outline:none;color:#fff;font-size:14px;font-weight:600;width:100%}.selectBox select option{background:#15102a}.btn{width:100%;margin-top:12px;padding:13px;background:linear-gradient(90deg,#7c3aed,#a855f7,#ec4899);border:none;border-radius:12px;color:#fff;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 0 18px #a855f766}.codeBox{border:1.5px dashed #e879f977;border-radius:14px;padding:16px;text-align:center;background:rgba(168,85,247,.07);min-height:100px;display:flex;flex-direction:column;justify-content:center;align-items:center;margin-top:8px}.code{font-family:'Orbitron',sans-serif;font-size:26px;font-weight:900;color:#67e8f9;letter-spacing:1px}.qrFull{width:100%;background:#fff;border-radius:14px;padding:10px;margin-top:10px;display:none}.qrFull img{width:100%;display:block;border-radius:8px}.footer{width:100%;max-width:500px;text-align:center;padding:16px 10px;color:#64748b;font-size:10px;font-weight:700}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="header"><div class="current-box" id="currentBox"><div class="current-icon">⚡</div></div><div class="logo" style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:27px"><span style="color:#e9d5ff">PROGRAMMER</span> <span style="color:#c084fc">MAHIR</span></div><div class="badge">🟢 Server 1 • Active • <span class="dot"></span></div></div><div class="container"><div class="card"><div class="quick-title">⚡ QUICK SETUP</div><ul class="quick-list"><li>1. <span><b>Select Country</b> - Default is Bangladesh (+880)</span></li><li>2. <span><b>Enter Number</b> - Enter without country code & 0</span></li><li>3. <span><b>Generate</b> - Click to get Pair Code & QR Code</span></li><li>4. <span><b>WhatsApp</b> > Linked Devices > Link with Phone Number - Paste Code</span></li><li>5. <span><b>QR Scan</b> - You can also scan the Full QR directly</span></li></ul></div><div class="card"><div class="label">🌐 Select Your Country</div><div class="selectBox"><select id="country"><option value="880" selected>🇧🇩 Bangladesh (+880) - Default</option><option value="92">🇵🇰 Pakistan (+92)</option><option value="91">🇮🇳 India (+91)</option><option value="1">🇺🇸 America (+1)</option><option value="975">🇧🇹 Bhutan (+975)</option><option value="44">🇬🇧 London (+44)</option><option value="65">🇸🇬 Singapore (+65)</option><option value="966">🇸🇦 Saudi Arabia (+966)</option></select></div><div class="label">WhatsApp Number</div><div class="inputBox">📱 <input id="number" type="text" inputmode="numeric" placeholder="1911..."></div><div style="font-size:11px;color:#8b9cff;margin-top:6px;font-weight:700">Full: <b id="fullPreview" style="color:#a5b4fc">+880</b></div><button class="btn" id="genBtn" onclick="generate()">⚡ Generate Pair Code & QR Code</button></div><div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:800;font-size:12px">Your pairing code will appear here</span><button onclick="copyCode()" style="background:#20153d;border:1px solid #a855f766;color:#fff;padding:6px 11px;border-radius:8px;cursor:pointer;font-weight:800;font-size:11px">📋 Copy</button></div><div class="codeBox"><div id="waiting"><div style="font-size:20px">🔗</div><div style="color:#c4b5fd;font-size:11px;margin-top:4px">Waiting for number...</div></div><div id="loader" style="display:none"><div style="width:26px;height:26px;border:3px solid #a855f744;border-top-color:#e879f9;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 6px"></div><div style="color:#e879f9;font-weight:800;font-size:11px">Fast Login...</div></div><div id="result" style="display:none"><div class="code" id="pairCode"></div><div id="expire" style="font-size:11px;color:#86efac;margin-top:4px;font-weight:700"></div><div style="font-size:9px;color:#94a3b8;margin-top:4px">Paste within 20 sec</div></div></div><div style="text-align:center;margin-top:12px"><div style="font-size:10px;color:#94a3b8;font-weight:800;letter-spacing:0.8px">FULL QR CODE - SCAN TO LINK</div><div class="qrFull" id="qrBox"><img id="qrImg"></div><div id="qrPlaceholder" style="border:1px dashed #a855f744;padding:16px;border-radius:12px;color:#6b7280;font-size:11px;margin-top:8px">Full QR Will Appear Here</div><div id="qrLoader" style="display:none;margin-top:8px;color:#e879f9;font-weight:700;font-size:11px">Generating Real QR...</div></div></div></div><div class="footer">2026 @2026 PROGRAMMER MAHIR - Powered By MAHIR</div><script>
const countryEl=document.getElementById('country'), numberEl=document.getElementById('number'), fullPreview=document.getElementById('fullPreview'), currentBox=document.getElementById('currentBox');
function upd(){let c=countryEl.value.replace(/\\D/g,''), raw=numberEl.value.replace(/\\D/g,''); if(raw.startsWith(c)) raw=raw.slice(c.length); if(raw.startsWith('0')) raw=raw.slice(1); let f=c+raw; fullPreview.innerText='+'+f; return f;}
function setDefault(){numberEl.value=''; upd();}
countryEl.addEventListener('change',()=>{ setDefault(); numberEl.focus(); });
numberEl.addEventListener('input',upd); setDefault(); let timer;
async function generate(){let num=upd(); if(num.length<10){alert('0 ছাড়া নাম্বার দাও - যেমন 1911575104');return;} let btn=document.getElementById('genBtn'); btn.disabled=true; btn.innerText='⏳ Fast Login...'; currentBox.classList.add('flow'); document.getElementById('waiting').style.display='none'; document.getElementById('result').style.display='none'; document.getElementById('loader').style.display='block'; document.getElementById('qrBox').style.display='none'; document.getElementById('qrPlaceholder').style.display='none'; document.getElementById('qrLoader').style.display='block'; try{let res1=await fetch('/code?number='+encodeURIComponent(num)); let data1=await res1.json(); if(data1.code){document.getElementById('loader').style.display='none'; document.getElementById('result').style.display='block'; document.getElementById('pairCode').innerText=data1.code; let s=60; clearInterval(timer); document.getElementById('expire').innerText='Expires in '+s+'s - PASTE NOW'; timer=setInterval(()=>{s--; document.getElementById('expire').innerText='Expires in '+s+'s'; if(s<=0)clearInterval(timer);},1000);} else{document.getElementById('loader').style.display='none'; document.getElementById('waiting').style.display='block'; document.getElementById('waiting').innerHTML='<div style="color:#ff6b6b;font-size:11px">'+(data1.error||'Failed')+'</div>';} let res2=await fetch('/qr'); let data2=await res2.json(); document.getElementById('qrLoader').style.display='none'; if(data2.qr){document.getElementById('qrImg').src=data2.qr; document.getElementById('qrBox').style.display='block';} else{document.getElementById('qrPlaceholder').style.display='block';}}catch(e){document.getElementById('qrLoader').style.display='none';} finally{btn.disabled=false; btn.innerText='⚡ Generate Pair Code & QR Code'; setTimeout(()=>currentBox.classList.remove('flow'),4000);}}
function copyCode(){let c=document.getElementById('pairCode').innerText; if(!c) return; navigator.clipboard.writeText(c.replace(/-/g,'')); alert('Copied: '+c);}
currentBox.addEventListener('click',()=>{ currentBox.classList.add('flow'); setTimeout(()=>currentBox.classList.remove('flow'),3000);});
</script></body></html>`);
});

app.get('/code', async (req,res)=>{
    let number = cleanNumber(req.query.number||'');
    if(!number || number.length<10) return res.json({error:'Valid number dao - 0 chara'});
    if(!sock) return res.json({error:'Bot starting, 10 sec por try koro'});
    try{
        let code = await sock.requestPairingCode(number);
        code = code.match(/.{1,4}/g)?.join("-") || code;
        console.log('PAIR OK',number,code);
        res.json({code, number:'+'+number});
    }catch(e){
        console.log('Pair Fail',e.message);
        res.json({error:'Failed: '+e.message+' | 10 sec por abar try koro'});
    }
});

app.get('/qr', async (req,res)=>{
    if(!lastQR) return res.json({qr:null});
    try{
        let data = await QRCode.toDataURL(lastQR,{width:900,margin:1});
        res.json({qr:data});
    }catch{ res.json({qr:null}); }
});

app.listen(PORT,()=>console.log('MAHIR RE-PROGRAMMED LIVE '+PORT));

let pendingAdd={}, pendingAddGid={}, pendingDownload={};
async function startBot(){
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    sock = makeWASocket({
        version,
        auth:{ creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({level:'silent'})) },
        logger:P({level:'silent'}),
        browser:['Ubuntu','Chrome','120.0.0.0'],
        syncFullHistory:false,
        markOnlineOnConnect:false,
        generateHighQualityLinkPreview:true,
        connectTimeoutMs:60000,
        keepAliveIntervalMs:10000
    });
    sock.ev.on('creds.update',saveCreds);
    sock.ev.on('connection.update',async(u)=>{
        const {connection, lastDisconnect, qr}=u;
        if(qr){ lastQR=qr; console.log('QR Ready'); }
        if(connection==='open'){ lastQR=null; console.log('BOT CONNECTED ✅'); }
        if(connection==='close'){
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut;
            if(shouldReconnect) setTimeout(startBot,2000);
            else{ if(fs.existsSync('./auth')) fs.rmSync('./auth',{recursive:true,force:true}); setTimeout(startBot,2000); }
        }
    });

    const menu = `╭───『 *MAHIR BOT* 』───\n│\n├─ *GROUP*\n│ •.kick @user\n│ •.promote @user\n│ •.demote @user\n│ •.group open / close\n│ •.tagall [msg]\n│ •.add\n│\n├─ *DOWNLOADER*\n│ •.yt link\n│ •.fb link\n│ •.tiktok link\n│ •.ig link\n│\n├─ *BROADCAST*\n│ •.broadcast msg\n│ •.bcgc msg\n│\n├─ *BOT*\n│ • hi / menu\n╰─────────────────`;

    sock.ev.on('messages.upsert',async({messages})=>{
        const m=messages[0]; if(!m.message||m.key.fromMe) return;
        const from=m.key.remoteJid; const isGroup=from.endsWith('@g.us');
        const text=(m.message.conversation||m.message.extendedTextMessage?.text||m.message.imageMessage?.caption||'').trim();
        const sender=m.key.participant||from; const lower=text.toLowerCase();

        if(['hi','hello','salam','menu','.menu','bot','mahir'].includes(lower)){
            const photo=getMyPhoto();
            try{ if(photo) await sock.sendMessage(from,{image:fs.readFileSync(photo),caption:menu},{quoted:m}); else await sock.sendMessage(from,{text:menu},{quoted:m}); }catch{ await sock.sendMessage(from,{text:menu},{quoted:m}); } return;
        }
        if(text.startsWith('.kick')&&isGroup){ const j=m.message.extendedTextMessage?.contextInfo?.mentionedJid; if(j) await sock.groupParticipantsUpdate(from,j,'remove'); }
        if(text.startsWith('.promote')&&isGroup){ const j=m.message.extendedTextMessage?.contextInfo?.mentionedJid; if(j) await sock.groupParticipantsUpdate(from,j,'promote'); }
        if(text.startsWith('.demote')&&isGroup){ const j=m.message.extendedTextMessage?.contextInfo?.mentionedJid; if(j) await sock.groupParticipantsUpdate(from,j,'demote'); }
        if(text==='.group close'&&isGroup) await sock.groupSettingUpdate(from,'announcement');
        if(text==='.group open'&&isGroup) await sock.groupSettingUpdate(from,'not_announcement');
        if(text.startsWith('.tagall')&&isGroup){ const meta=await sock.groupMetadata(from); const mem=meta.participants.map(p=>p.id); await sock.sendMessage(from,{text:text.replace('.tagall','').trim()||'Attention!',mentions:mem},{quoted:m}); }
        if(text.startsWith('.broadcast')||text.startsWith('.bcgc')){ const msg=text.replace('.broadcast','').replace('.bcgc','').trim(); if(!msg) return; const groups=await sock.groupFetchAllParticipating(); for(let id of Object.keys(groups)) await sock.sendMessage(id,{text:`*📢 BROADCAST:*\n\n${msg}`}); await sock.sendMessage(from,{text:`✅ Sent to ${Object.keys(groups).length} groups`}); }
        if(lower==='.add'){ const groups=await sock.groupFetchAllParticipating(); const list=Object.values(groups); let msg='*Select Group:*\n\n'; list.forEach((g,i)=>msg+=`*${i+1}.* ${g.subject}\n`); msg+='\nReply:.select 1'; pendingAdd[sender]=list; await sock.sendMessage(from,{text:msg},{quoted:m}); }
        if(text.startsWith('.select ')){ const num=parseInt(text.split(' ')[1])-1; const list=pendingAdd[sender]; if(!list||!list[num]) return; pendingAddGid[sender]=list[num].id; await sock.sendMessage(from,{text:`*Selected:* ${list[num].subject}\n\nNow send:\n.add\n8801xxxx`},{quoted:m}); }
        if(text.startsWith('.add\n')){ const gid=pendingAddGid[sender]; if(!gid) return; let nums=text.replace('.add','').trim().split(/[\n, ]+/).filter(n=>n.length>=10); let jids=nums.map(n=>cleanNumber(n)+'@s.whatsapp.net').slice(0,20); try{ await sock.groupParticipantsUpdate(gid,jids,'add'); await sock.sendMessage(from,{text:`✅ Added ${jids.length}`}); }catch{ await sock.sendMessage(from,{text:`Failed! Bot admin koro`}); } }
        if(text.startsWith('.yt ')||text.startsWith('.fb ')||text.startsWith('.tiktok ')||text.startsWith('.ig ')||text.startsWith('.download ')){ let url=text.split(' ')[1]; if(url) handleDL(from,m,url); }
    });

    async function handleDL(from,m,url){
        try{
            await sock.sendMessage(from,{text:'⏳ Downloading... '+url},{quoted:m});
            let api=`https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`;
            if(url.includes('tiktok')) api=`https://api.akuari.my.id/downloader/tiktok?link=${encodeURIComponent(url)}`;
            if(url.includes('fb')||url.includes('facebook')) api=`https://api.akuari.my.id/downloader/fb?link=${encodeURIComponent(url)}`;
            if(url.includes('instagram')) api=`https://api.akuari.my.id/downloader/ig?link=${encodeURIComponent(url)}`;
            const r=await axios.get(api);
            let vurl=r.data?.respon?.url||r.data?.result?.url||r.data?.url;
            if(vurl) await sock.sendMessage(from,{video:{url:vurl},caption:'✅ By Mahir Bot'},{quoted:m});
            else await sock.sendMessage(from,{text:'❌ Link not found'},{quoted:m});
        }catch{ await sock.sendMessage(from,{text:'❌ Download failed'},{quoted:m}); }
    }
}
startBot();
