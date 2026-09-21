require('dotenv').config();
const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { state, saveCreds } = useSingleFileAuthState('./auth.json');
const fs = require('fs');
const pino = require('pino');
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use(express.json());

const PORT = process.env.PORT || 10000;
let sock, isReady = false;

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({
        version,
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })) },
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Mahir Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', u => {
        if (u.connection === 'open') { isReady = true; console.log("✅ Bot Ready"); }
        if (u.connection === 'close') { isReady = false; setTimeout(startBot, 3000); }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const textRaw = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
        const text = textRaw.toLowerCase();
        const getMentioned = () => msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // ===== 1. HI / HELLO MENU WITH YOUR PHOTO =====
        if (['hi', 'hello', 'bot', 'menu', '.menu', 'mahir'].includes(text)) {
            const caption = `🤖 *MD MAHIR PROGRAMMER BOT* 🤖

👤 *Owner:* MD Mahir
💻 *Work:* Full Stack Developer
🔥 *Motto:* NEVER GIVE UP

━━━━━━━━━━━━━━━━━━
📌 *GROUP COMMANDS:*
━━━━━━━━━━━━━━━━━━
➡️.at - সবাইকে Tag
➡️.at group Hello - মেসেজ সহ Tag
➡️.add 8801XXXXXXXX - মেম্বার Add
➡️.kick @user - Remove করবে
➡️.promote @user - Admin বানাবে
➡️.demote @user - Admin থেকে নামাবে
➡️.groupmsg Hello - সব গ্রুপে মেসেজ যাবে

━━━━━━━━━━━━━━━━━━
✨ *Hi/Hello লিখলেই আমি Ready!*
🌐 *Pair Website থেকে Pair Code নিন*`;

            try {
                if (fs.existsSync('./img/your-photo.jpg')) {
                    await sock.sendMessage(from, { image: fs.readFileSync('./img/your-photo.jpg'), caption });
                } else {
                    await sock.sendMessage(from, { text: caption });
                }
            } catch {
                await sock.sendMessage(from, { text: caption });
            }
            return;
        }

        // ===== 2. TAG ALL =====
        if (text === '.at' || text.startsWith('.at ') || text.startsWith('.at group')) {
            if (!isGroup) return sock.sendMessage(from, { text: "❌ গ্রুপে ব্যবহার করুন" });
            try {
                const meta = await sock.groupMetadata(from);
                const mentions = meta.participants.map(p => p.id);
                let extra = textRaw.replace(/\.at group/i, '').replace(/\.at/i, '').trim();
                let tagText = `📢 *Tag All* ${extra? '\n' + extra + '\n\n' : '\n'}`;
                for (let id of mentions) tagText += `@${id.split('@')[0]} `;
                await sock.sendMessage(from, { text: tagText, mentions });
            } catch { await sock.sendMessage(from, { text: "❌ Bot কে Admin করুন" }); }
            return;
        }

        // ===== 3. ADD SYSTEM =====
        if (text.startsWith('.add')) {
            if (!isGroup) return;
            let nums = textRaw.match(/\d{10,14}/g);
            if (!nums) return sock.sendMessage(from, { text: "Use:.add 8801911575104" });
            try {
                let toAdd = nums.map(n => { if (n.startsWith('0')) n = '88' + n; return n + '@s.whatsapp.net'; });
                await sock.groupParticipantsUpdate(from, toAdd, "add");
                await sock.sendMessage(from, { text: `✅ Added: ${nums.join(', ')}` });
            } catch (e) { await sock.sendMessage(from, { text: "❌ " + e.message }); }
            return;
        }

        // ===== 4. KICK / PROMOTE / DEMOTE =====
        if (text.startsWith('.kick') || text.startsWith('.promote') || text.startsWith('.demote')) {
            if (!isGroup) return;
            let targets = getMentioned();
            if (!targets.length) return sock.sendMessage(from, { text: "❌ @mention করুন" });
            let action = text.startsWith('.kick')? 'remove' : text.startsWith('.promote')? 'promote' : 'demote';
            try { await sock.groupParticipantsUpdate(from, targets, action); await sock.sendMessage(from, { text: `✅ ${action} Done` }); } catch { await sock.sendMessage(from, { text: "❌ Bot কে Admin করুন" }); }
            return;
        }

        // ===== 5. GROUP BROADCAST =====
        if (text.startsWith('.groupmsg')) {
            let message = textRaw.replace(/^\.groupmsg\s*/i, '').trim();
            if (!message) return sock.sendMessage(from, { text: "Use:.groupmsg Your Message" });
            try {
                let groups = await sock.groupFetchAllParticipating();
                let gids = Object.keys(groups);
                let c = 0;
                for (let gid of gids) { try { await sock.sendMessage(gid, { text: `📢 *Broadcast*\n\n${message}` }); c++; await new Promise(r => setTimeout(r, 800)); } catch {} }
                await sock.sendMessage(from, { text: `✅ Sent to ${c} groups` });
            } catch { await sock.sendMessage(from, { text: "❌ Failed" }); }
            return;
        }
    });
}
startBot();

// ===== PAIR CODE SYSTEM =====
app.get('/pair', async (req, res) => {
    let number = req.query.number?.replace(/[^0-9]/g, '');
    if (!number) return res.json({ error: "Number দিন" });
    if (!sock) return res.json({ error: "Bot Starting... 20s পর Try করুন" });
    if (isReady) return res.json({ error: "Already Connected!" });
    try { await new Promise(r => setTimeout(r, 1500)); let code = await sock.requestPairingCode(number); res.json({ code }); }
    catch (e) { res.json({ error: e.message }); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log("Running on " + PORT));
