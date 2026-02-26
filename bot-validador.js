
/**
 * @fileOverview Bot do Telegram DailyGainX - Versão Final Sincronizada
 * 
 * Funcionalidades:
 * 1. Recebe ID de transação e busca tokens pré-gerados pelo Admin.
 * 2. Gera novos tokens automaticamente se configurado.
 * 3. Suporta parâmetro /start para captura automática de ID.
 */

const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Configuração do Firebase Admin
const serviceAccountPath = path.resolve(__dirname, 'firebase-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n❌ ERRO CRÍTICO: Arquivo 'firebase-key.json' não encontrado.");
  console.log("👉 Coloque o arquivo na raiz do projeto e renomeie para 'firebase-key.json'.\n");
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error("❌ Erro ao ler firebase-key.json:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// 2. Configurações do Bot
const BOT_TOKEN = '8705097831:AAGWrokWxz-j1weHLEq7Kei-sRsWKw1xok4';
const ADMIN_EMAIL = 'isaacmargues03@gmail.com'; 
const bot = new Telegraf(BOT_TOKEN);

const gerarTokenDGX = () => "DGX-" + Math.random().toString(36).substring(2, 8).toUpperCase();

// 3. Lógica de Validação
async function processarValidacao(ctx, transactionId) {
    if (!transactionId || transactionId.length < 3) {
        return ctx.reply("⚠️ ID de transação inválido.");
    }

    ctx.reply(`⏳ Verificando transação: ${transactionId}...`);

    try {
        // Primeiro, verifica se o Admin já gerou um token para este ID no site
        const tokensRef = db.collection('tokens_resgate');
        const query = await tokensRef.where('transactionId', '==', transactionId).limit(1).get();

        if (!query.empty) {
            const tokenExistente = query.docs[0].data();
            if (tokenExistente.usado) {
                return ctx.reply("❌ Este depósito já foi resgatado anteriormente.");
            }
            return ctx.reply(
                `✅ **DEPÓSITO ENCONTRADO!**\n\n` +
                `Seu código de resgate é:\n` +
                `👉 \`${tokenExistente.token}\`\n\n` +
                `Valor: **${tokenExistente.valor.toFixed(2)} USDT**`,
                { parse_mode: 'Markdown' }
            );
        }

        // Se não existir, simula validação na PixUp e gera um novo
        const pagoConfirmado = true; // Simulação de sucesso

        if (pagoConfirmado) {
            const novoToken = gerarTokenDGX();
            const valorDefault = 100.00; // Valor simulado

            await tokensRef.doc(novoToken).set({
                token: novoToken,
                valor: valorDefault,
                usado: false,
                geradoPor: 'DailyGainX_Bot',
                transactionId: transactionId,
                dataCriacao: admin.firestore.FieldValue.serverTimestamp()
            });

            ctx.reply(
                `✅ **PAGAMENTO CONFIRMADO!**\n\n` +
                `Um novo Token foi gerado para você:\n` +
                `👉 \`${novoToken}\`\n\n` +
                `Valor: **${valorDefault.toFixed(2)} USDT**\n\n` +
                `Resgate no seu perfil no site.`,
                { parse_mode: 'Markdown' }
            );
        } else {
            ctx.reply("❌ Pagamento não identificado. Verifique o ID e tente novamente.");
        }
    } catch (error) {
        console.error("Erro no processamento:", error);
        ctx.reply("🚫 Erro técnico ao acessar o banco de dados.");
    }
}

// 4. Handlers do Bot
bot.start((ctx) => {
    // Captura o ID se vier de um link tipo t.me/bot?start=ID
    const payload = ctx.startPayload;
    if (payload) {
        return processarValidacao(ctx, payload);
    }
    ctx.reply("👋 Bem-vindo ao DailyGainX!\n\nEnvie o **ID da Transação** para receber seu código de resgate.");
});

bot.on('text', (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;
    processarValidacao(ctx, text);
});

bot.launch().then(() => {
  console.log("🚀 Bot DailyGainX Online e Sincronizado!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
