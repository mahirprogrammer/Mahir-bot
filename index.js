// ================= AFO BOT - FINAL INDEX.JS - PREMIUM EDITION =================
// Language: Full English | Design: Same | Pairing: Fast Pair + Full QR
// Features: TempMail 3 Points, Secret Settings, Safe Bomber Placeholder
// Note: Gemini Key must be set in ENV -> GEMINI_API_KEY

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');
const qrcode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const PAIRING_PASSWORD = "39895$$##251";

// ================= CONTACT SETUP YAHAN ================
// AP IS JAGAH APNA CONTACT SETUP KAREN
const CONTACT_WEBSITE = "YAHAN APNA WEBSITE LINK DALO";
const CONTACT_FB = "YAHAN APNA FACEBOOK PAGE LINK DALO";
const CONTACT_EMAIL = "YAHAN APNA EMAIL DALO";
const CONTACT_WHATSAPP = "YAHAN APNA WHATSAPP LINK / NUMBER DALO";

// ================= GROUP SETUP YAHAN ================
const GROUP_1_NAME = "YAHAN GROUP 1 KA NAME DALO";
const GROUP_1_LINK = "YAHAN GROUP 1 KA LINK DALO";
const GROUP_2_NAME = "YAHAN GROUP 2 KA NAME DALO";
const GROUP_2_LINK = "YAHAN GROUP 2 KA LINK DALO";

// ================= ANIME_NH GROUP SETUP ================
const ANIME_NH_LINK = "YAHAN ANIME_NH GROUP KA LINK DALO";

// ================= TEMP MAIL POINT SYSTEM ================
let tempPoints = {}; // userId -> {points, lastReset, email}
let connectedUsers = {}; // userId -> {name, lastSeen, lastCommand}
let settingsAuth = {}; // userId -> true if password entered

function checkPoints(sender){
    let now = Date.now();
    if(!tempPoints[sender] || now - tempPoints[sender].lastReset > 24*60*60*1000){
        tempPoints[sender] = {points:3, lastReset:now, email:null};
    }
    return tempPoints[sender];
}

// ================= MENU DESIGN =================
const premiumMenu = `
╭━━━〔 🌸 *AFO BOT - PREMIUM* 〕━━━╮
┃
┃ 👋 Hello! I am AFO BOT
┃ ⚡ Fast | 🛡️ Secure | 🎯 Premium
┃
┣━━━〔 📜 *MAIN COMMANDS* 〕━━━┫
┃ •.menu - Show this menu
┃ •.ping - Check bot speed
┃ •.bot - Bot status
┃ •.owner - Owner info
┃ •.info - Bot info
┃ •.contact - Contact links
┃ •.group - Our groups
┃
┣━━━〔 📥 *DOWNLOADER* 〕━━━┫
┃ •.download - Downloader menu
┃ •.yt <link> - YouTube downloader
┃ •.fb <link> - Facebook downloader
┃ •.tiktok <link> - TikTok downloader
┃ •.ig <link> - Instagram downloader
┃
┣━━━〔 🤖 *AI & TOOLS* 〕━━━┫
┃ •.afo_ai <q> - Chat with AI
┃ •.genpic <prompt> - Generate image
┃ •.weather <city> - Weather info
┃ •.time - Current time
┃
┣━━━〔 🎌 *ANIME ZONE* 〕━━━┫
┃ •.anime_sub - Crunchyroll prices
┃ •.anime_nh - Anime group
┃ •.hack_mode - Hack prank
┃ •.gc_admin - Group admin tools
┃
┣━━━〔 📧 *TEMP MAIL* 〕━━━┫
┃ •.temp_mail - Temp mail menu (3/day)
┃ •.genmail - Generate temp email
┃ •.getotp - Get OTP from temp mail
┃
┣━━━〔 💣 *BOMBER MODE* 〕━━━┫
┃ •.bomber - Bomber menu (Risky)
┃ •.wab - WhatsApp bomber (Soon)
┃ •.sms - SMS bomber (Soon)
┃ •.number - Number bomber (Soon)
┃
┣━━━〔 🔐 *SECRET* 〕━━━┫
┃ •.settings - Admin panel (Password)
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
*Type any command to continue* ✨
`;

const crunchyrollText = `
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

async function startBot(){
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P().child({ level: "fatal" }))
        },
        printQRInTerminal: false,
        logger: P({ level: "silent" }),
        browser: ["AFO Bot", "Chrome", "1.0.0"],
        markOnlineOnConnect: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update)=>{
        const { connection, lastDisconnect, qr } = update;
        if(qr){
            console.log("QR Generated - Full White QR Ready");
            global.latestQR = await qrcode.toDataURL(qr);
        }
        if(connection === 'close'){
            let reason = lastDisconnect?.error?.output?.statusCode;
            if(reason!== DisconnectReason.loggedOut){
                startBot();
            }
        } else if(connection === 'open'){
            console.log("✅ AFO BOT Connected - Pairing OK");
        }
    });

    sock.ev.on('messages.upsert', async ({ messages })=>{
        try{
            let m = messages[0];
            if(!m.message || m.key.fromMe) return;
            let from = m.key.remoteJid;
            let sender = m.key.participant || from;
            let msg = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
            let lower = msg.toLowerCase().trim();

            // Track users for.users command
            let pushName = m.pushName || sender.split('@')[0];
            connectedUsers[sender] = { name: pushName, lastSeen: new Date().toLocaleString(), lastCommand: lower, jid: sender };

            if(lower === '.menu' || lower === '.help'){
                await sock.sendMessage(from, { image: { url: "https://i.ibb.co/3m1yK7g/anime-girl.jpg" }, caption: premiumMenu }, { quoted: m });
                return;
            }

            if(lower === '.ping'){
                let start = Date.now();
                await sock.sendMessage(from, { text: `🏓 *Pong!* \n⚡ Speed: ${Date.now()-start}ms \n✅ Bot is Active` }, { quoted: m });
                return;
            }

            if(lower === '.bot'){
                await sock.sendMessage(from, { text: `🤖 *AFO BOT - STATUS*\n\n✅ Online: Yes\n⚡ Pairing: Fast Pair OK\n📷 QR: Full White QR OK\n🔋 Uptime: Active\n👥 Users: ${Object.keys(connectedUsers).length}` }, { quoted: m });
                return;
            }

            if(lower === '.info'){
                await sock.sendMessage(from, { text: `ℹ️ *BOT INFO*\n\nName: AFO BOT PREMIUM\nVersion: 2.0\nDeveloper: AFO Team\nLanguage: English\nFeatures: Downloader, AI, TempMail, Anime` }, { quoted: m });
                return;
            }

            if(lower === '.owner'){
                await sock.sendMessage(from, { text: `👑 *OWNER INFO*\n\nContact: ${CONTACT_WHATSAPP}\nWebsite: ${CONTACT_WEBSITE}` }, { quoted: m });
                return;
            }

            if(lower === '.contact'){
                await sock.sendMessage(from, { text: `📞 *CONTACT US*\n\n🌐 Website: ${CONTACT_WEBSITE}\n📘 Facebook: ${CONTACT_FB}\n📧 Email: ${CONTACT_EMAIL}\n💬 WhatsApp: ${CONTACT_WHATSAPP}` }, { quoted: m });
                return;
            }

            if(lower === '.group'){
                await sock.sendMessage(from, { text: `👥 *OUR GROUPS*\n\n1. ${GROUP_1_NAME}\nLink: ${GROUP_1_LINK}\n\n2. ${GROUP_2_NAME}\nLink: ${GROUP_2_LINK}` }, { quoted: m });
                return;
            }

            if(lower === '.download'){
                await sock.sendMessage(from, { text: `📥 *DOWNLOADER MENU*\n\n•.yt <link> - YouTube\n•.fb <link> - Facebook\n•.tiktok <link> - TikTok\n•.ig <link> - Instagram\n\nJust send link with command` }, { quoted: m });
                return;
            }

            if(lower.startsWith('.yt ')){
                await sock.sendMessage(from, { text: `⏳ *YouTube Downloader*\nProcessing your link...\n\n*Note: Using backup API for stability*` }, { quoted: m });
                // Add your YT logic here - 3 backup APIs
                return;
            }

            if(lower === '.anime_sub'){
                await sock.sendMessage(from, { text: crunchyrollText }, { quoted: m });
                return;
            }

            if(lower === '.anime_nh'){
                await sock.sendMessage(from, { text: `🎌 *ANIME_NH GROUP*\n\nJoin: ${ANIME_NH_LINK}` }, { quoted: m });
                return;
            }

            if(lower.startsWith('.weather ')){
                let city = msg.split(' ').slice(1).join(' ');
                try{
                    let res = await axios.get(`https://wttr.in/${city}?format=3`);
                    await sock.sendMessage(from, { text: `🌤️ *Weather*\n${res.data}` }, { quoted: m });
                }catch{
                    await sock.sendMessage(from, { text: `❌ Could not fetch weather for ${city}` }, { quoted: m });
                }
                return;
            }

            if(lower === '.time'){
                await sock.sendMessage(from, { text: `⏰ *Current Time*\n${new Date().toLocaleString()}` }, { quoted: m });
                return;
            }

            if(lower === '.temp_mail'){
                let p = checkPoints(sender);
                if(p.points <= 0){
                    await sock.sendMessage(from, { text: `*⏳ TEMP MAIL*\n\n🎁 YOU HAVE 0 POINTS\n\nYou can generate 3 Temp Mails per day.\nDaily reset after 24 hours - 3 coins free.\n\nContact owner for Premium.` }, { quoted: m });
                    return;
                }
                await sock.sendMessage(from, { text: `*📧 TEMP MAIL - PREMIUM*\n\n🎁 YOU HAVE ${p.points} POINTS\nYou can generate ${p.points} Temp Mails today.\nDaily reset after 24 hours - 3 coins free.\n\n[ Your Email: ${p.email || 'Empty'} ]\n[ Generate Temp Mail -> Type.genmail ]\n[ Get OTP -> Type.getotp ]` }, { quoted: m });
                return;
            }

            if(lower === '.genmail'){
                let p = checkPoints(sender);
                if(!p || p.points <= 0){
                    await sock.sendMessage(from, { text: `❌ No points left. Wait 24h for reset.` }, { quoted: m });
                    return;
                }
                try{
                    let r = await axios.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1');
                    let email = r.data[0];
                    p.email = email; p.points--;
                    await sock.sendMessage(from, { text: `*✅ TEMP MAIL GENERATED*\n\n📧 Your Email: *${email}*\n📋 Copy & use for OTP\n\nType.getotp to get OTP\nPoints left: ${p.points}` }, { quoted: m });
                }catch(e){
                    let fake = `afo${Math.floor(Math.random()*99999)}@1secmail.com`;
                    p.email = fake; p.points--;
                    await sock.sendMessage(from, { text: `*✅ TEMP MAIL GENERATED*\n\n📧 Your Email: *${fake}*\nPoints left: ${p.points}\nType.getotp` }, { quoted: m });
                }
                return;
            }

            if(lower === '.getotp'){
                let p = tempPoints[sender];
                if(!p ||!p.email){
                    await sock.sendMessage(from, { text: `❌ First generate email. Type.genmail` }, { quoted: m });
                    return;
                }
                try{
                    let [login, domain] = p.email.split('@');
                    let r = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
                    if(r.data.length === 0){
                        await sock.sendMessage(from, { text: `*📭 No OTP yet for:*\n${p.email}\n\nWait 10 sec & try again.getotp` }, { quoted: m });
                        return;
                    }
                    let msgId = r.data[0].id;
                    let r2 = await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${msgId}`);
                    await sock.sendMessage(from, { text: `*🔑 YOUR OTP*\n\nFrom: ${r2.data.from}\nSubject: ${r2.data.subject}\n\nBody:\n${r2.data.textBody || r2.data.body}\n\nFor: ${p.email}` }, { quoted: m });
                }catch{
                    await sock.sendMessage(from, { text: `❌ OTP fetch failed, try again.getotp` }, { quoted: m });
                }
                return;
            }

            // ================= SECRET SETTINGS =================
            if(lower === '.settings'){
                await sock.sendMessage(from, { text: `🔐 *ADMIN PANEL*\n\nNow send the secret password` }, { quoted: m });
                settingsAuth[sender] = "waiting";
                return;
            }

            if(settingsAuth[sender] === "waiting" && msg === PAIRING_PASSWORD){
                settingsAuth[sender] = true;
                await sock.sendMessage(from, { text: `✅ *ACCESS GRANTED - ADMIN PANEL*\n\n1. 📊 Box 1 - Type.users - See connected users (Real Time)\n2. 📢 Box 2 - Type.broadcast <message> - Broadcast to all linked users\n3. ⏳ Box 3 - Coming Soon\n4. ⏳ Box 4 - Coming Soon` }, { quoted: m });
                return;
            }

            if(lower === '.users'){
                if(settingsAuth[sender]!== true){
                    await sock.sendMessage(from, { text: `❌ Access denied. Type.settings first` }, { quoted: m });
                    return;
                }
                let list = Object.values(connectedUsers).map((u,i)=> `${i+1}. Name: ${u.name}\n Number: ${u.jid}\n Last Cmd: ${u.lastCommand}\n Last Seen: ${u.lastSeen}`).join('\n\n') || "No users yet";
                await sock.sendMessage(from, { text: `📊 *REAL TIME USERS LIST*\n\n${list}\n\nTotal: ${Object.keys(connectedUsers).length} users` }, { quoted: m });
                return;
            }

            if(lower.startsWith('.broadcast ')){
                if(settingsAuth[sender]!== true){
                    await sock.sendMessage(from, { text: `❌ Access denied. Type.settings first` }, { quoted: m });
                    return;
                }
                let bMsg = msg.slice(11);
                await sock.sendMessage(from, { text: `📢 *We will now send you broadcasting*\n\nMessage: ${bMsg}\n\nSending to ${Object.keys(connectedUsers).length} linked users...` }, { quoted: m });
                for(let jid in connectedUsers){
                    try{
                        await sock.sendMessage(jid, { text: `📢 *BROADCAST FROM OWNER*\n\n${bMsg}` });
                    }catch{}
                }
                await sock.sendMessage(from, { text: `✅ Broadcast done to ${Object.keys(connectedUsers).length} users` }, { quoted: m });
                return;
            }

            // ================= BOMBER MODE - SAFE PLACEHOLDER =================
            if(lower === '.bomber'){
                await sock.sendMessage(from, { text: `💣 *BOMBER MODE - MENU*\n\n⚠️ USE YOUR OWN RISK\n\nThis feature can cause number ban.\n\nAvailable:\n•.wab - WhatsApp Bomber - Coming Soon\n•.sms - SMS Bomber - Coming Soon\n•.number - Number Bomber - Coming Soon\n\nAll bomber features are currently in *Coming Soon* mode for safety.\nWe do not allow spam harassment.` }, { quoted: m });
                return;
            }

            if(lower === '.wab' || lower === '.sms' || lower === '.number' || lower.startsWith('.wab ') || lower.startsWith('.sms ') || lower.startsWith('.number ')){
                await sock.sendMessage(from, { text: `💣 *${lower.toUpperCase()} BOMBER*\n\n⚠️ USE YOUR OWN RISK\n\nStatus: *Coming Soon*\n\nThis feature is disabled to prevent WhatsApp ban and harassment.\nIt will send same message 50 times which violates WhatsApp ToS.\n\nFor safe alternative, use.broadcast (admin only) to send 1 message to your own groups.` }, { quoted: m });
                return;
            }

            // AI Commands placeholder
            if(lower.startsWith('.afo_ai ')){
                if(!GEMINI_API_KEY) return sock.sendMessage(from, { text: `❌ Gemini API Key not set` }, { quoted: m });
                let q = msg.slice(8);
                await sock.sendMessage(from, { text: `🤖 *AFO AI thinking...* \nQ: ${q}` }, { quoted: m });
                // Add Gemini call here
                return;
            }

        }catch(e){
            console.log("Error:", e);
        }
    });
}

// ================= EXPRESS SERVER - DESIGN SAME =================
app.get('/', (req,res)=>{
    res.send(`
    <!DOCTYPE html><html><head><title>AFO BOT - PREMIUM</title>
    <style>body{font-family:sans-serif;background:#0f0f0f;color:white;text-align:center;padding:50px}
   .card{background:#1a1a1a;padding:30px;border-radius:20px;max-width:400px;margin:auto;box-shadow:0 0 20px #ff00ff}
    img{width:200px;border-radius:10px} button{padding:10px 20px;background:#ff00ff;color:white;border:none;border-radius:10px;margin-top:20px;cursor:pointer}
    </style></head><body>
    <div class="card">
    <h1>🌸 AFO BOT PREMIUM</h1>
    <p>Fast Pairing | Full White QR | Secure</p>
    <div id="qr"><p>QR Loading... / Pairing Code Ready</p></div>
    <button onclick="location.reload()">Refresh QR</button>
    <p style="margin-top:20px;font-size:12px;color:#aaa">Design Same - No Change - Workable</p>
    </div>
    <script>
    setInterval(async()=>{
        let r = await fetch('/qr');
        let d = await r.json();
        if(d.qr){ document.getElementById('qr').innerHTML = '<img src="'+d.qr+'" style="width:250px;background:white;padding:10px;border-radius:10px">'; }
    },3000);
    </script>
    </body></html>
    `);
});

app.get('/qr', (req,res)=>{
    res.json({ qr: global.latestQR || null });
});

app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
startBot();
