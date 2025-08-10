const http = require("http");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

// ===== CONFIGURE SEU NÚMERO AQUI PARA RECEBER BACKUPS =====
const numeroDono = "5599981462301@s.whatsapp.net";

// Banco de dados
let db = { regras: {} };
const dbPath = path.join(__dirname, "db.json");
if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath));
}
function saveDb() {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

async function enviarBackup(sock, grupoNome) {
    try {
        await sock.sendMessage(numeroDono, {
            document: fs.readFileSync(dbPath),
            mimetype: "application/json",
            fileName: "db.json",
            caption: `📦 Backup automático gerado!\n📌 Grupo alterado: *${grupoNome}*`
        });
    } catch (err) {
        console.log("Erro ao enviar backup:", err);
    }
}

// Servidor para manter ativo no Render
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot está rodando!\n");
}).listen(process.env.PORT || 3000);

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

        let tipoUsuario = isGroup && isAdmin ? "👑 ADM" : "👤 Usuário";

        const sendText = async (jid, text) => {
            await sock.sendMessage(jid, { text, ephemeralExpiration: 0 });
        };

        // MENUS
        if (messageContent === "!menu") {
            await sendText(from, `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━ ✦ 🔎 *MENU PRINCIPAL* ✦
*|*► *!menu 0*   ❓ Informação
*|*► *!menu 1*   🖼️ Figurinhas
*|*► *!menu 2*   ⚒️ Utilidades
*|*► *!menu 3*   🧩 Variado
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`);
        }

        if (messageContent === "!menu 0") {
            await sendText(from, `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
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
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`);
        }

        if (messageContent === "!menu 1") {
            await sendText(from, `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━ ✦ 🖼️ *FIGURINHAS* ✦
*|*► *!s* - Imagem/vídeo para sticker
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`);
        }

        if (messageContent === "!menu 2") {
            await sendText(from, `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━━ ✦ ⚒️ *UTILIDADES* ✦
*|*► *!piada* - Recebe uma piada aleatória
*|*► *!curiosidade* - Recebe uma curiosidade aleatória
*|*► *ping* - Testar latência
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༾✦`);
        }

        if (messageContent === "!menu 3") {
            await sendText(from, `👋 Olá, *${nomeContato}*\nTipo de Usuário: ${tipoUsuario}
────────────────────────
*|*━━━ ✦ *🤖 agathabot* ✦
*|*
*|*━━ ✦ 🕹️ *JOGOS* ✦
*|*► *!ppt* opção - Joga pedra, papel e tesoura
*|*► *!caracoroa* cara|coroa - Joga cara ou coroa
*|*► *!roletarussa* - Joga roleta russa
*|*► *!chance* algo - Chance de algo acontecer
*|*
*|*━━✦༻ _*Feito por: Matt*_ ༺✦`);
        }

        // COMANDOS
        if (messageContent === "!curiosidade") {
            await sendText(from, curiosidades[Math.floor(Math.random() * curiosidades.length)]);
        }

        if (messageContent === "!piada") {
            await sendText(from, piadas[Math.floor(Math.random() * piadas.length)]);
        }

        if (messageContent.startsWith("!ppt")) {
            const escolhaJogador = messageContent.split(" ")[1];
            const opcoes = ["pedra", "papel", "tesoura"];
            const emojis = { pedra: "✊", papel: "✋", tesoura: "✌️" };

            if (!opcoes.includes(escolhaJogador)) {
                return sendText(from, "❗ Use: !ppt pedra | !ppt papel | !ppt tesoura");
            }

            const escolhaBot = opcoes[Math.floor(Math.random() * opcoes.length)];
            let resultado = "😭 *Derrota!*";
            if (escolhaJogador === escolhaBot) resultado = "😐 *Empate!*";
            else if (
                (escolhaJogador === "pedra" && escolhaBot === "tesoura") ||
                (escolhaJogador === "papel" && escolhaBot === "pedra") ||
                (escolhaJogador === "tesoura" && escolhaBot === "papel")
            ) resultado = "😁 *Vitória!*";

            await sendText(from, `${resultado}\n\nVocê: ${emojis[escolhaJogador]} | Bot: ${emojis[escolhaBot]}`);
        }

        // Novo: Cara ou coroa
        if (messageContent.startsWith("!caracoroa")) {
            const escolha = messageContent.split(" ")[1];
            if (!["cara", "coroa"].includes(escolha)) {
                return sendText(from, "❗ Use corretamente: !caracoroa cara | !caracoroa coroa");
            }
            await sendText(from, "🪙 Lançando a moeda...");
            const resultado = Math.random() < 0.5 ? "cara" : "coroa";
            const imgPath = path.join(__dirname, `${resultado}.png`);
            await sock.sendMessage(from, { image: fs.readFileSync(imgPath), caption: `${escolha === resultado ? "😁 *Vitória!*" : "😭 *Derrota!*"}\n\nO resultado caiu *${resultado.toUpperCase()}*` });
        }

        // Novo: Roleta russa
        if (messageContent === "!roletarussa") {
            await sendText(from, "🔫 *Roleta russa*");
            if (Math.random() < 0.16) {
                await sendText(from, "💀 A arma disparou, você morreu.");
            } else {
                await sendText(from, "😁 A arma não disparou, você sobreviveu.");
            }
        }

        // Novo: Chance
        if (messageContent.startsWith("!chance")) {
            const frase = messageContent.replace("!chance", "").trim();
            if (!frase) return sendText(from, "❗ Use: !chance algo");
            const chance = Math.floor(Math.random() * 101);
            await sendText(from, `📊 *Chance*\n\nVocê tem *${chance}%* de chance de *${frase}*`);
        }

        // Comando PING
        if (messageContent === "ping" || messageContent === "!ping") {
            const start = Date.now();
            await sendText(from, "🏓 Pong!");
            const end = Date.now();
            await sendText(from, `⏱️ Latência: ${end - start}ms`);
        }

        if (messageContent === "!info") {
            const imagePath = path.join(__dirname, "agatha.jpg");
            await sock.sendMessage(from, {
                image: fs.readFileSync(imagePath),
                caption: `*🏷️ Nome do bot:* agathabot
*Versão:* 1.2.9
*📄 Criado por:* Matt
*💻 Desenvolvido com:* Baileys + Node.js
*📚 Propósito:* Bot pessoal com foco em ajudar grupos.
*Contato do administrador:* +55 99 98146-2301`
            });
        }

        // REGRAS + BACKUP
        if (messageContent.startsWith("!setregras")) {
            if (!isGroup) return sendText(from, "❌ Apenas em grupos.");
            if (!isAdmin) return sendText(from, "❌ Apenas administradores podem alterar as regras.");

            const regrasTexto = messageContent.replace("!setregras", "").trim();
            if (!regrasTexto) return sendText(from, "Digite as regras após o comando. Ex: !setregras Não enviar links");

            db.regras[from] = regrasTexto;
            saveDb();

            const grupoNome = isGroup ? (await sock.groupMetadata(from)).subject : "Desconhecido";
            await enviarBackup(sock, grupoNome);

            return sendText(from, "✅ Regras atualizadas com sucesso! Backup enviado ao dono.");
        }

        if (messageContent === "!regras") {
            if (!isGroup) return sendText(from, "❌ Apenas em grupos.");
            const regrasDoGrupo = db.regras[from] || "📌 Nenhuma regra definida ainda.";
            return sendText(from, `📜 Regras do grupo:\n\n${regrasDoGrupo}`);
        }

        // FIGURINHAS
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
                await sock.sendMessage(from, { sticker: await sticker.toBuffer(), ephemeralExpiration: 0 }, { quoted: msg });
            } catch {
                await sendText(from, "⚠️ Ocorreu um erro ao criar a figurinha.");
            }
        }
    });

    // BOAS-VINDAS
    sock.ev.on("group-participants.update", async (anu) => {
        try {
            const metadata = await sock.groupMetadata(anu.id);
            for (let num of anu.participants) {
                if (anu.action == "add") {
                    let welcomeText = `👋 Olá @${num.split('@')[0]}! Bem-vindo(a) ao grupo *${metadata.subject}*.\n\nDigite !menu para ver os comandos.\nUse !regras para conhecer as regras.`;
                    await sock.sendMessage(anu.id, { text: welcomeText, mentions: [num], ephemeralExpiration: 0 });
                }
            }
        } catch (err) {
            console.log(err);
        }
    });
}

startBot();
