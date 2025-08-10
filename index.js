const http = require("http");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

// Banco de dados
let db = { regras: {} };
const dbPath = path.join(__dirname, "db.json");
if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath));
}
function saveDb() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Servidor para manter ativo no Render
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot está rodando!\n");
}).listen(process.env.PORT || 3000);

// Auto-ping a cada 5 minutos
setInterval(() => {
    http.get(`http://${process.env.RENDER_EXTERNAL_HOSTNAME}`);
}, 5 * 60 * 1000);

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
        "Você conhece a piada do pônei? Pô nei eu.",
        "O que o pagodeiro foi fazer na igreja? Cantar pá God.",
        "O que o pato falou para a pata? Vem quá.",
        "Você sabe qual é o rei dos queijos? O reiqueijão.",
        "O que acontece quando chove na Inglaterra? Vira Inglalama.",
        "O que o tomate foi fazer no banco? Tirar extrato.",
        "Por que a velhinha não usa relógio? Porque ela é sem hora (senhora).",
        "Por que há uma cama elástica no polo Norte? Para o urso polar.",
        "A plantinha foi ao hospital, mas não foi atendida. Por que? Porque lá só tinha médico de plantão.",
        "Fui comprar um remédio e o farmacêutico perguntou se eu tinha receita. Respondi que se eu tivesse a receita, faria o remédio em casa.",
        "Por que o livro de matemática se matou? Porque tinha muitos problemas."
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
        const isGroup = from.endsWith("@g.us");
        let isAdmin = false;

        if (isGroup) {
            const metadata = await sock.groupMetadata(from);
            const sender = msg.key.participant || msg.participant || from;
            isAdmin = metadata.participants.find(p => p.id === sender)?.admin;
        }

        console.log("📩 Mensagem recebida:", messageContent);

        let tipoUsuario = isGroup && isAdmin ? "👑 ADM" : "👤 Usuário";

        // ========================= MENUS =========================
        if (messageContent === "!menu") {
            const mensagem = `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━ ✦ 🔎 *MENU PRINCIPAL* ✦
*|*► *!menu 0*   ❓ Informação
*|*► *!menu 1*   🖼️ Figurinhas
*|*► *!menu 2*   ⚒️ Utilidades
*|*► *!menu 3*   🧩 Variado
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
        }

        if (messageContent === "!menu 0") {
            const mensagem = `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━━ Guia ❔: *!comando* guia
*|*
*|*━━━━ ✦ ❓ *INFO/SUPORTE* ✦
*|*► *!info* - Informações do bot
*|*► *!regras* - Regras do grupo
*|*► *!setregras* - Apenas para ADM
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
        }

        if (messageContent === "!menu 1") {
            const mensagem = `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━ ✦ 🖼️ *FIGURINHAS* ✦
*|*► *!s* - Imagem/vídeo para sticker
*|*━━━ _Mais comandos em breve!_
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
        }

        if (messageContent === "!menu 2") {
            const mensagem = `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━ ✦ ⚒️ *UTILIDADES* ✦
*|*► *!piada* - Recebe uma piada aleatória
*|*► *!curiosidade* - Recebe uma curiosidade aleatória
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`;
            await sock.sendMessage(from, { text: mensagem });
        }

        if (messageContent === "!menu 3") {
            const mensagem = `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━ ✦ 🕹️ *JOGOS* ✦
*|*► *!ppt* opção - Joga pedra, papel e tesoura
*|*► *!caracoroa* - Joga cara ou coroa - em breve
*|*► *!roletarussa* - Joga roleta russa - em breve
*|*
*|*━━ ✦ 🧩 *ENTRETENIMENTO* ✦
*|*► *!chance* texto - Chance de algo acontecer - em breve
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༺✦`;
            await sock.sendMessage(from, { text: mensagem });
        }

        // ========================= COMANDOS =========================
        if (messageContent === "!curiosidade") {
            await sock.sendMessage(from, { text: curiosidades[Math.floor(Math.random() * curiosidades.length)] });
        }

        if (messageContent === "!piada") {
            await sock.sendMessage(from, { text: piadas[Math.floor(Math.random() * piadas.length)] });
        }

        if (messageContent.startsWith("!ppt")) {
            const escolhaJogador = messageContent.split(" ")[1];
            const opcoes = ["pedra", "papel", "tesoura"];
            const emojis = { pedra: "✊", papel: "✋", tesoura: "✌️" };

            if (!opcoes.includes(escolhaJogador)) {
                return sock.sendMessage(from, { text: "❗ Use: !ppt pedra | !ppt papel | !ppt tesoura" });
            }

            const escolhaBot = opcoes[Math.floor(Math.random() * opcoes.length)];
            let resultado = "😭 *Derrota!*";
            if (escolhaJogador === escolhaBot) resultado = "😐 *Empate!*";
            else if (
                (escolhaJogador === "pedra" && escolhaBot === "tesoura") ||
                (escolhaJogador === "papel" && escolhaBot === "pedra") ||
                (escolhaJogador === "tesoura" && escolhaBot === "papel")
            ) resultado = "😁 *Vitória!*";

            await sock.sendMessage(from, { text: `${resultado}\n\nVocê: ${emojis[escolhaJogador]} | Bot: ${emojis[escolhaBot]}` });
        }

        if (messageContent === "!info") {
            const imagePath = path.join(__dirname, "agatha.jpg");
            await sock.sendMessage(from, {
                image: fs.readFileSync(imagePath),
                caption: `*🏷️ Nome do bot:* agathabot
*Versão:* 1.2.2
*📄 Criado por:* Matt
*💻 Desenvolvido com:* Baileys + Node.js
*📚 Propósito:* Bot pessoal com foco em ajudar grupos.
*Contato do administrador:* +55 99 98146-2301`
            });
        }

        // ========================= REGRAS =========================
        if (messageContent.startsWith("!setregras")) {
            if (!isGroup) return sock.sendMessage(from, { text: "❌ Apenas em grupos." });
            if (!isAdmin) return sock.sendMessage(from, { text: "❌ Apenas administradores podem alterar as regras." });

            const regrasTexto = messageContent.replace("!setregras", "").trim();
            if (!regrasTexto) return sock.sendMessage(from, { text: "Digite as regras após o comando. Ex: !setregras Não enviar links" });

            db.regras[from] = regrasTexto;
            saveDb();
            return sock.sendMessage(from, { text: "✅ Regras atualizadas com sucesso!" });
        }

        if (messageContent === "!regras") {
            if (!isGroup) return sock.sendMessage(from, { text: "❌ Apenas em grupos." });
            const regrasDoGrupo = db.regras[from] || "📌 Nenhuma regra definida ainda.";
            return sock.sendMessage(from, { text: `📜 Regras do grupo:\n\n${regrasDoGrupo}` });
        }

        // ========================= FIGURINHAS =========================
        const tipoMsg = Object.keys(msg.message)[0];
        const isStickerCommand = messageContent === "!s";
        const temLegendaS = msg.message?.[tipoMsg]?.caption?.toLowerCase() === "!s";
        const isReplyStickerCommand = isStickerCommand && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage &&
            (msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage || msg.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage);

        if ((tipoMsg === "imageMessage" || tipoMsg === "videoMessage") && temLegendaS || isReplyStickerCommand) {
            try {
                const quoted = isReplyStickerCommand
                    ? { message: msg.message.extendedTextMessage.contextInfo.quotedMessage }
                    : msg;
                const mediaBuffer = await downloadMediaMessage(quoted, "buffer", {}, {
                    logger: P({ level: "silent" }),
                    reuploadRequest: sock.updateMediaMessage
                });
                const sticker = new Sticker(mediaBuffer, {
                    type: StickerTypes.FULL,
                    pack: "AgathaBot",
                    author: "Matt",
                    quality: 70,
                });
                await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: msg });
            } catch {
                await sock.sendMessage(from, { text: "⚠️ Ocorreu um erro ao criar a figurinha." });
            }
        }
    });

    // Boas-vindas
    sock.ev.on("group-participants.update", async (anu) => {
        try {
            const metadata = await sock.groupMetadata(anu.id);
            for (let num of anu.participants) {
                if (anu.action == "add") {
                    let welcomeText = `👋 Olá @${num.split('@')[0]}! Bem-vindo(a) ao grupo *${metadata.subject}*.\n\nDigite !menu para ver os comandos.\nUse !regras para conhecer as regras.`;
                    await sock.sendMessage(anu.id, { text: welcomeText, mentions: [num] });
                }
            }
        } catch (err) {
            console.log(err);
        }
    });
}

startBot();
