const http = require("http");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");

// Servidor simples para manter o bot ativo no Render
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

        console.log("📩 Mensagem recebida:", messageContent);

        // Detectar se é grupo e se o remetente é admin
        let tipoUsuario = "👤 Usuário";
        if (from.endsWith("@g.us")) {
            const metadata = await sock.groupMetadata(from);
            const sender = msg.key.participant || msg.participant || from;
            const isAdmin = metadata.participants.find(p => p.id === sender)?.admin;
            if (isAdmin) tipoUsuario = "👑 ADM";
        }

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
*|*━━━━ Guia ❔: *!comando* guia
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
            const curiosidadeAleatoria = curiosidades[Math.floor(Math.random() * curiosidades.length)];
            await sock.sendMessage(from, { text: curiosidadeAleatoria });
        }

        if (messageContent === "!piada") {
            const piadaAleatoria = piadas[Math.floor(Math.random() * piadas.length)];
            await sock.sendMessage(from, { text: piadaAleatoria });
        }

        if (messageContent.startsWith("!ppt")) {
            const escolhaJogador = messageContent.split(" ")[1];
            const opcoes = ["pedra", "papel", "tesoura"];
            const emojis = { pedra: "✊", papel: "✋", tesoura: "✌️" };

            if (!opcoes.includes(escolhaJogador)) {
                await sock.sendMessage(from, {
                    text: `❗ Não foi possível realizar o comando *!ppt*.

*Motivo*: Parece que você usou o comando *!ppt* incorretamente ou não sabe como utilizá-lo.

❔ USO DO COMANDO ❔
Ex: *!ppt pedra*
Ex: *!ppt papel*
Ex: *!ppt tesoura*`
                });
                return;
            }

            const escolhaBot = opcoes[Math.floor(Math.random() * opcoes.length)];

            if (escolhaJogador === escolhaBot) {
                await sock.sendMessage(from, { text: `😐 *Empate!*\n\nVocê escolheu ${emojis[escolhaJogador]} e o bot escolheu ${emojis[escolhaBot]}` });
            } else if (
                (escolhaJogador === "pedra" && escolhaBot === "tesoura") ||
                (escolhaJogador === "papel" && escolhaBot === "pedra") ||
                (escolhaJogador === "tesoura" && escolhaBot === "papel")
            ) {
                await sock.sendMessage(from, { text: `😁 *Vitória!*\n\nVocê escolheu ${emojis[escolhaJogador]} e o bot escolheu ${emojis[escolhaBot]}` });
            } else {
                await sock.sendMessage(from, { text: `😭 *Derrota!*\n\nVocê escolheu ${emojis[escolhaJogador]} e o bot escolheu ${emojis[escolhaBot]}` });
            }
        }

        if (messageContent === "ping") {
            const start = Date.now();
            await sock.sendMessage(from, { text: "🏓 Pong!" });
            const end = Date.now();
            await sock.sendMessage(from, { text: `⏱️ Latência: ${end - start}ms` });
        }

        if (messageContent === "!info") {
            const imagePath = path.join(__dirname, "agatha.jpg");
            const caption = `*🏷️ Nome do bot:* agathabot
*Versão:* 1.1.7
*📄 Criado por:* Matt
*💻 Desenvolvido com:* Baileys + Node.js
*📚 Propósito:* Bot pessoal com foco em ajudar grupos.
*Contato do administrador:* +55 99 98146-2301`;
            await sock.sendMessage(from, { image: fs.readFileSync(imagePath), caption });
        }

        // Figurinha
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
                await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
            } catch (err) {
                console.error("❌ Erro ao gerar figurinha:", err);
                await sock.sendMessage(from, { text: "⚠️ Ocorreu um erro ao criar a figurinha." });
            }
        }
    });
}

startBot();
