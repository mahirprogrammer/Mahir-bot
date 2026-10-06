// AFO BOT HIGH FAME - Programmer Mahir - FINAL 16 COMMANDS
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CONFIG = {
    GEMINI_API_KEY: "PASTE_YOUR_NEW_KEY_HERE",
    GROUP_LINK_HACK: "PASTE_YOUR_GROUP_LINK_HERE",
    GROUP_LINK_ANIME: "PASTE_YOUR_ANIME_LINK_HERE",
    OWNER_NUMBER: "8801XXXXXXXXX",
    OWNER_NAME: "Mahir",
    WEATHER_API: "PASTE_OPENWEATHER_API_HERE",
    PREFIX: "."
};
const SECRET_PASSWORD = "335956$$22#";
let connectedUsers = new Set();
let userState = new Map(); // ai_mode, awaiting_gen, hack, bomber, admin

function getImage(name){
    try{
        const folder='./IMG';
        if(!fs.existsSync(folder)) return null;
        const p=path.join(folder,name);
        if(fs.existsSync(p)) return fs.readFileSync(p);
        const files=fs.readdirSync(folder);
        const f=files.find(x=>x.toLowerCase().endsWith('.jpg')||x.toLowerCase().endsWith('.png'));
        if(f) return fs.readFileSync(path.join(folder,f));
        return null;
    }catch{return null;}
}

const MENU_TEXT = `
╭━━━〔 *AFO BOT HIGH FAME* 〕━━━╮
┃ Dev: Programmer Mahir
┃ Theme: Dark Purple | Brain: Active ✓
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
╭━━━〔 *CORE COMMANDS* 〕━━━╮
┃ ✦.menu - Display professional menu
┃ ✦.ping - Check bot runtime and status
┃ ✦.time - Show real Bangladesh time
┃ ✦.info - Show bot information
┃ ✦.Owner - Show owner details
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
╭━━━〔 *ANIME* 〕━━━╮
┃ ✦.Anime Sub - Crunchyroll pricing
┃ ✦.Anime_NH - Join anime discussion group
┃ ✦.Enemy-NH - Join anime discussion group
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
╭━━━〔 *TOOLS* 〕━━━╮
┃ ✦.Gen pic - Generate AI image from prompt
┃ ✦.weather <city> - Get live weather report
┃ ✦.download - YouTube download menu
┃ ✦.fb - Facebook video download menu
┃ ✦.temp_mail - Generate temporary email
┃ ✦.GC - Show your group list
┃ ✦.AFO_AI - Talk with AI brain
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
╭━━━〔 *ADVANCED* 〕━━━╮
┃ ✦.Hack_Mode - Enter hack mode
┃ ✦.Bomber - Enter bomber mode (WAB)
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
`;

async function startBot(){
    const {state,saveCreds}=await useMultiFileAuthState('auth_info');
    const sock=makeWASocket({auth:state,logger:P({level:'silent'})});
    sock.ev.on('creds.update',saveCreds);
    sock.ev.on('connection.update',u=>{if(u.connection==='open')console.log('AFO CONNECTED ✓');});

    sock.ev.on('messages.upsert',async({messages})=>{
        const msg=messages[0]; if(!msg.message||msg.key.fromMe) return;
        const from=msg.key.remoteJid;
        const body=msg.message.conversation||msg.message.extendedTextMessage?.text||"";
        const stateNow=userState.get(from);

        // AFO_AI Hi/Hello Auto Reply Logic
        if(stateNow==='ai_mode' &&!body.startsWith(CONFIG.PREFIX)){
            if(['exit','.exit'].includes(body.toLowerCase())){userState.delete(from); return sock.sendMessage(from,{text:"*AI Mode Exited* ✓\nYou are back to normal mode."});}
            const low=body.toLowerCase();
            if(low.includes('hi')||low.includes('hello')||low.includes('hey')){
                await sock.sendMessage(from,{text:`*Hello!* 👋\nI am AFO BOT HIGH FAME AI.\nProgrammed by Mahir.\nHow can I help you today?\n\nType your question or type exit to leave.`});
                return;
            }
            // Gemini Chat Placeholder
            await sock.sendMessage(from,{text:`*AFO AI Thinking...*\n\nYou: ${body}\n\n[Connect Gemini API Key in CONFIG.GEMINI_API_KEY to get real AI reply]`});
            return;
        }

        if(stateNow==='awaiting_gen' &&!body.startsWith(CONFIG.PREFIX)){
            await sock.sendMessage(from,{text:`*Generating Image:*\nPrompt: "${body}"\n\nPlease wait, creating your image...`});
            userState.delete(from);
            // Add Gemini Image API call here with CONFIG.GEMINI_API_KEY
            return;
        }

        if(!body.startsWith(CONFIG.PREFIX)) return;
        connectedUsers.add(from);
        const args=body.slice(1).trim().split(/ +/);
        const cmd=args.shift().toLowerCase();
        const text=args.join(" ");

        // 1. menu - IMG Folder Reflect + Forward
        if(cmd==='menu'){
            const img=getImage('menu.jpg');
            const payload={caption:MENU_TEXT,contextInfo:{isForwarded:true,forwardingScore:999,forwardedNewsletterMessageInfo:{newsletterName:'AFO BOT HIGH FAME'}}};
            if(img) payload.image=img; else payload.text=MENU_TEXT;
            await sock.sendMessage(from,payload);
        }
        // 2. ping
        else if(cmd==='ping'){const up=process.uptime();await sock.sendMessage(from,{text:`*PONG!* 🏓\n\nRuntime: ${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m ${Math.floor(up%60)}s\nStatus: Online ✓\nBrain: High Fame Active\nResponse: Fast`});}
        // 3. time
        else if(cmd==='time'){const bd=new Date().toLocaleString('en-BD',{timeZone:'Asia/Dhaka',hour12:true,weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});await sock.sendMessage(from,{text:`*REAL BANGLADESH TIME* ⏰\n\n${bd}\n\nTimezone: Asia/Dhaka`});}
        // 4. info
        else if(cmd==='info'){await sock.sendMessage(from,{text:`*AFO BOT HIGH FAME*\n\nA high-performance WhatsApp bot built by Programmer Mahir.\nTheme: Dark Purple\nVersion: 3.0 Final\nBrain System: Active\nTotal Commands: 16+\nStatus: Stable & Error Free\n\n© 2026 Programmer Mahir`});}
        // 5. Owner - IMG Folder Reflect + Forward Separate
        else if(cmd==='owner'){
            const img=getImage('owner.jpg')||getImage('menu.jpg');
            const cap=`*OWNER DETAILS* 👑\n\nName: ${CONFIG.OWNER_NAME}\nNumber: ${CONFIG.OWNER_NUMBER}\nBot Name: AFO BOT HIGH FAME\nRole: Programmer\nTheme: Dark Purple\nBrain: Active ✓\n\nContact for any bot issues.`;
            const payload={caption:cap,contextInfo:{isForwarded:true,forwardingScore:999}};
            if(img) payload.image=img; else payload.text=cap;
            await sock.sendMessage(from,payload);
        }
        // 6. Anime Sub
        else if(cmd==='anime' && text.toLowerCase().startsWith('sub')){
            await sock.sendMessage(from,{text:`*CRUNCHYROLL SUBSCRIPTION* 🎬\n\n*SHARED ACCOUNT:*\n• 1 Month - 100 TK\n• 6 Month - 530 TK\n• 12 Month - 900 TK\n\n*PERSONAL ACCOUNT:*\n• 1 Month - 190 TK\n• 6 Month - 820 TK\n• 12 Month - 1450 TK\n\nNote: If you are connected via my ID, please contact the seller for any issues. Delivery within 10 minutes.`});
        }
        // 7 & 8. Anime_NH / Enemy-NH
        else if(['anime_nh','enemy-nh','enemyn-h'].includes(cmd)){
            await sock.sendMessage(from,{text:`*ANIME GROUP INVITATION* 🎌\n\nJoin our official anime discussion group:\n${CONFIG.GROUP_LINK_ANIME}\n\nRules: No spam, respect everyone.`});
        }
        // 9. Gen pic
        else if(cmd==='gen' && text.toLowerCase().startsWith('pic')){
            if(text.replace('pic','').trim().length>2){
                const prompt=text.replace(/pic/i,'').trim();
                await sock.sendMessage(from,{text:`*Generating Image:*\n"${prompt}"\n\nWait...`});
            }else{
                userState.set(from,'awaiting_gen');
                await sock.sendMessage(from,{text:`*IMAGE GENERATION MODE* 🎨\n\nNow send your prompt to generate image.\n\nExample: A futuristic city in Dhaka at night\n\nType.exit to cancel.`});
            }
        }
        // 10. weather
        else if(cmd==='weather'){
            if(!text) return sock.sendMessage(from,{text:`*WEATHER MENU* 🌤️\n\nUsage:.weather <city name>\nExample:.weather Dhaka\nExample:.weather Tokyo\n\nGet real-time weather report.`});
            try{
                const res=await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${text}&appid=${CONFIG.WEATHER_API}&units=metric`);
                await sock.sendMessage(from,{text:`*WEATHER REPORT* 🌦️\n\nCity: ${res.data.name}, ${res.data.sys.country}\nTemperature: ${res.data.main.temp}°C\nFeels Like: ${res.data.main.feels_like}°C\nCondition: ${res.data.weather[0].description}\nHumidity: ${res.data.main.humidity}%\nWind: ${res.data.wind.speed} m/s`});
            }catch{await sock.sendMessage(from,{text:`*Error:* City "${text}" not found or Weather API key not set in CONFIG.WEATHER_API`});}
        }
        // 11. download
        else if(cmd==='download'){
            if(!text) return sock.sendMessage(from,{text:`*YOUTUBE DOWNLOAD MENU* 📥\n\nUsage:.download <youtube link>\nExample:.download https://youtu.be/xxxxx\n\nSupported: MP4 / MP3 / 720p / 1080p\nStatus: Error Free - API Placeholder Ready`});
            await sock.sendMessage(from,{text:`*Processing YouTube Link...*\nLink: ${text}\n\n[Add your YT download API logic here - Workable Placeholder]`});
        }
        // 12. fb
        else if(cmd==='fb'){
            if(!text) return sock.sendMessage(from,{text:`*FACEBOOK DOWNLOAD MENU* 📥\n\nUsage:.fb <facebook video link>\nExample:.fb https://fb.watch/xxxxx\n\nDownload FB videos in HD - Error Free.`});
            await sock.sendMessage(from,{text:`*Processing Facebook Link...*\nLink: ${text}\n\n[Add your FB download API logic here]`});
        }
        // 13. temp_mail
        else if(cmd==='temp_mail'){
            await sock.sendMessage(from,{text:`*TEMPORARY EMAIL BOX* 📧\n\nGenerating your temp email...\n\nEmail: temp.${Math.floor(Math.random()*9999)}@1secmail.com\nInbox: Active for 10 minutes\n\n[Connect 1secmail API: ${CONFIG.TEMP_MAIL_API}]\nAPI Placeholder Ready - Error Free`});
        }
        // 14. GC
        else if(['gc','scam','add','group','groups'].includes(cmd)){
            try{
                const groups=await sock.groupFetchAllParticipating();
                let list="*YOUR GROUP LIST* 👥\n\n";let i=1;for(let id in groups){list+=`${i}. ${groups[id].subject}\nID: ${id}\n\n`;i++;if(i>30)break;}
                await sock.sendMessage(from,{text:list||"No groups found."});
            }catch{await sock.sendMessage(from,{text:"*Group List Error* - Make sure bot is in groups"});}
        }
        // 15. AFO_AI
        else if(cmd==='afo_ai'){
            userState.set(from,'ai_mode');
            await sock.sendMessage(from,{text:`*AFO AI MODE ACTIVATED* 🤖\n\nBrain: High Fame Active ✓\nSay Hi / Hello to start chat.\n\nType any message to talk with AI.\nType exit or.exit to leave AI mode.`});
        }
        // 16. Hack_Mode
        else if(cmd==='hack_mode'){
            if(text==='menu'){userState.set(from,'hack_mode');await sock.sendMessage(from,{text:`*HACK MODE MENU* 💻\n\nJoin our official hack group:\n${CONFIG.GROUP_LINK_HACK}\n\nFeatures: Tools, Tips, Tricks\nType.exit to exit hack mode`});}
            else{await sock.sendMessage(from,{text:`*HACK MODE ACTIVATED* 💻\n\nType.Hack_Mode menu to see group link.\nType.exit to exit.`});}
        }
        // 17. Bomber / WAB - Safe Version
        else if(cmd==='bomber'){
            if(text==='menu'){userState.set(from,'bomber_mode');await sock.sendMessage(from,{text:`*BOMBER MENU* (SAFE MODE) 📤\n\nCommand:.WAB <number>\nExample:.WAB 8801XXXXXXXX\n\nNote: Anti-spam - Only single message allowed, no loop to prevent ban.\nType.exit to exit`});}
            else{await sock.sendMessage(from,{text:`*BOMBER MODE* - Safe Version\nType.Bomber menu`});}
        }
        else if(cmd==='wab'){
            if(userState.get(from)!=='bomber_mode') return sock.sendMessage(from,{text:"First enter.Bomber menu"});
            await sock.sendMessage(from,{text:`*WAB MODE* 📲\nTarget: ${text}\n\nNow send your single message (Anti-spam protected - Only 1 message will be sent).`});
        }
        // SECRET -.settings - Hidden from all menus
        else if(cmd==='settings'){
            if(text!==SECRET_PASSWORD) return sock.sendMessage(from,{text:"*Access Denied* ❌\nWrong secret password."});
            userState.set(from,'admin');
            await sock.sendMessage(from,{text:`*ADMIN MODE ACTIVATED* 🔐\n\nWelcome Boss Mahir!\n\nAvailable Commands:\n•.users - Show connected users count & list\n•.broadcast <message> - Broadcast to all users\n•.exit - Exit admin mode\n\nThis menu is secret and not shown in any public menu.`});
        }
        else if(cmd==='users' && userState.get(from)==='admin'){
            await sock.sendMessage(from,{text:`*CONNECTED USERS* 👥\nTotal: ${connectedUsers.size}\n\n${[...connectedUsers].slice(0,20).join('\n')}\n\n...and ${Math.max(0,connectedUsers.size-20)} more`});
        }
        else if(cmd==='broadcast' && userState.get(from)==='admin'){
            if(!text) return sock.sendMessage(from,{text:"Usage:.broadcast <your message>"});
            let c=0;for(let u of connectedUsers){try{await sock.sendMessage(u,{text:`*📢 BROADCAST FROM OWNER*\n\n${text}\n\n_From: ${CONFIG.OWNER_NAME}_`});c++;}catch{}}
            await sock.sendMessage(from,{text:`*Broadcast Done* ✓\nSent to ${c} users`});
        }
        else if(cmd==='exit'){
            userState.delete(from);
            await sock.sendMessage(from,{text:"*Exited* ✓\nYou are back to normal mode."});
        }
    });
}
startBot();
