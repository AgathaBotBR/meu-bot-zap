const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

let db = {};
const dbPath = path.join(__dirname, "db.json");

if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
} else {
    db = { comandos: 0, patente: "🔋 Usuário" };
}

function salvarDB() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info_baileys");

    const sock = makeWASocket({
        logger: P({ level: "silent" }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Conexão encerrada. Reconectando...", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("✅ Bot conectado com sucesso!");
        }
    });

    const curiosidades = [
        "🧠 Sabia que os golfinhos dormem com um olho aberto?",
        "🦍 As corujas conseguem girar a cabeça em até 270°!",
        "🌌 Existem mais estrelas no universo do que grãos de areia na Terra!",
        "🖙 O polvo tem três corações!",
        "🔥 A temperatura de um raio pode chegar a 30.000°C!",
        "🚀 O primeiro e-mail foi enviado em 1971!",
        "🐝 Abelhas podem reconhecer rostos humanos!",
        "🌍 Você está se movendo a 1.600 km/h com a rotação da Terra agora!"
    ];

    const piadas = [
        "Por que o computador foi ao médico? Porque ele estava com vírus!",
        "O que o pato falou para a pata? Vem Quá!",
        "Por que a aranha é o animal mais carente? Porque ela é um aracneedy!",
        "Qual é o cúmulo do azar? Quebrar a perna da cadeira e sentar nela mesmo assim.",
        "Por que o livro de matemática se matou? Porque tinha muitos problemas.",
        "O que o tomate foi fazer no banco? Tirar extrato!",
        "Como o elétron atende o telefone? Próton!",
        "Por que o elefante não usa computador? Porque ele tem medo do mouse!"
    ];

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const numero = from.split("@")[0];
        const nomeContato = msg.pushName || numero;

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const messageContent = texto.toLowerCase();

        db.comandos += 1;
        salvarDB();

        const dados = db;

        console.log("📩 Mensagem recebida:", messageContent);

        if (messageContent === "ping") {
            await sock.sendMessage(from, { text: "🏓 pong!" });
            return;
        }

        if (messageContent === "!menu") {
            const mensagem = `👋 Olá, *${nomeContato}*
Tipo de Usuário: ${dados.patente}
Comandos feitos: ${dados.comandos}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━ ✦ 🔎 *MENU PRINCIPAL* ✦
*|*► *!menu* 0   ❓ Informação
*|*► *!menu* 1   🖼️ Figurinhas
*|*► *!menu* 2   ⚒️ Utilidades _-em breve!_
*|*► *!menu* 3   🧩 Variado
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
            return;
        }

        if (messageContent === "!menu 0") {
            const mensagem = `👋 Olá, *${nomeContato}*
Tipo de Usuário: ${dados.patente}
Comandos feitos: ${dados.comandos}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|* 📄 Criado por: *Matt*
*|* 💻 Desenvolvido com: *Baileys + Node.js*
*|* 📚 Propósito: *Bot pessoal com foco em figurinhas, humor e informação!*
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
            return;
        }

        if (messageContent === "!menu 1") {
            const mensagem = `👋 Olá, *${nomeContato}*
Tipo de Usuário: ${dados.patente}
Comandos feitos: ${dados.comandos}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|* 
*|*━━━ ✦ ❓ Guia: *!comando* guia _- em breve_
*|*
*|*━━━ ✦ 🖼️ *FIGURINHAS* ✦
*|*► *!s* - Imagem/vídeo para sticker
*|*━━━ _Mais comandos em breve!_
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
            return;
        }

        if (messageContent === "!menu 3") {
            const mensagem = `👋 Olá, *${nomeContato}*
Tipo de Usuário: ${dados.patente}
Comandos feitos: ${dados.comandos}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|* 
*|*━━━ ✦ 🧩 *VARIADO* ✦
*|*► *!piada* - Recebe uma piada aleatória
*|*► *!curiosidade* - Recebe uma curiosidade aleatória
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
            return;
        }

        if (messageContent === "!curiosidade") {
            const curiosidadeAleatoria = curiosidades[Math.floor(Math.random() * curiosidades.length)];
            await sock.sendMessage(from, { text: curiosidadeAleatoria });
            return;
        }

        if (messageContent === "!piada") {
            const piadaAleatoria = piadas[Math.floor(Math.random() * piadas.length)];
            await sock.sendMessage(from, { text: piadaAleatoria });
            return;
        }

        const tipoMsg = Object.keys(msg.message)[0];
        const temLegendaS = msg.message?.[tipoMsg]?.caption?.toLowerCase() === "!s";

        if ((tipoMsg === "imageMessage" || tipoMsg === "videoMessage") && temLegendaS) {
            try {
                const mediaBuffer = await downloadMediaMessage(msg, "buffer", {}, {
                    logger: P({ level: "silent" }),
                    reuploadRequest: sock.updateMediaMessage
                });

                const sticker = new Sticker(mediaBuffer, {
                    type: StickerTypes.FULL,
                    pack: "AgathaBot",
                    author: "Matt",
                    quality: 70,
                });

                const stickerBuffer = await sticker.toBuffer();

                await sock.sendMessage(from, {
                    sticker: stickerBuffer
                }, { quoted: msg });

            } catch (err) {
                console.error("❌ Erro ao gerar figurinha:", err);
                await sock.sendMessage(from, { text: "⚠️ Ocorreu um erro ao criar a figurinha." });
            }
            return;
        }
    });
}

startBot();
