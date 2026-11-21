const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) start();
        } else if (connection === 'open') {
            console.log('هيما متصلة! 🔥');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        
        if (text.toLowerCase() === 'هلا' || text.toLowerCase() === 'hi') {
            await sock.sendMessage(from, { text: 'هلا والله! انا هيما بوت 🔥👑 كيف اقدر اساعدك؟' });
        }
        if (text === '!منيو' || text === '!menu') {
            await sock.sendMessage(from, { text: 'اوامر هيما:\n- هلا\n- !منيو\n- !ملصق' });
        }
    });
}

start();
