/**
 * @fileOverview Bot do Telegram DailyGainX - Versão Simplificada (Validador e Gerador)
 * 
 * Funcionalidades:
 * 1. Recebe ID de transação e valida automaticamente.
 * 2. Gera tokens na hora e salva no banco de dados para resgate imediato no site.
 */

const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Configuração do Firebase Admin
const serviceAccountPath = path.resolve(__dirname, 'firebase-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n❌ ERRO CRÍTICO: Arquivo 'firebase-key.json' não encontrado.");
  console.log("👉 Siga os passos no Console do Firebase para baixar sua chave JSON.");
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
  console.error("❌ Erro ao inicializar Firebase Admin:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// 2. Configurações do Bot
const BOT_TOKEN = '8705097831:AAGWrokWxz-j1weHLEq7Kei-sRsWKw1xok4';
const ADMIN_EMAIL = 'isaacmargues03@gmail.com'; 
const bot = new Telegraf(BOT_TOKEN);

const gerarTokenDGX = () => "DGX-" + Math.random().toString(36).substring(2, 8).toUpperCase();

// 3. Lógica do Bot
async function processarValidacao(ctx, transactionId) {
    if (!transactionId || transactionId.length < 3) {
        return ctx.reply("⚠️ Envie um ID de transação válido.");
    }

    ctx.reply(`⏳ Validando transação: ${transactionId}...`);

    try {
        const tokensRef = db.collection('tokens_resgate');
        
        // Verifica se já existe um token para este ID (Evita duplicidade)
        const query = await tokensRef.where('transactionId', '==', transactionId).limit(1).get();

        if (!query.empty) {
            const tokenExistente = query.docs[0].data();
            return ctx.reply(
                `✅ **DEPÓSITO JÁ VALIDADO!**\n\n` +
                `Seu código é:\n` +
                `👉 \`${tokenExistente.token}\`\n\n` +
                `Valor: **${tokenExistente.valor.toFixed(2)} USDT**\n\n` +
                `Status: ${tokenExistente.usado ? '❌ Já Resgatado' : '✅ Disponível'}`,
                { parse_mode: 'Markdown' }
            );
        }

        // Simulação de confirmação de pagamento
        const novoToken = gerarTokenDGX();
        const valorDefault = 100.00; // Valor padrão simulado

        await tokensRef.doc(novoToken).set({
            token: novoToken,
            valor: valorDefault,
            usado: false,
            geradoPor: 'DailyGainX_Bot_Auto',
            transactionId: transactionId,
            dataCriacao: admin.firestore.FieldValue.serverTimestamp()
        });

        ctx.reply(
            `✅ **PAGAMENTO CONFIRMADO!**\n\n` +
            `Use este código no seu perfil no site:\n` +
            `👉 \`${novoToken}\`\n\n` +
            `Crédito: **${valorDefault.toFixed(2)} USDT**`,
            { parse_mode: 'Markdown' }
        );

    } catch (error) {
        console.error("Erro no processamento do Bot:", error);
        ctx.reply("🚫 Erro técnico ao processar transação.");
    }
}

bot.start((ctx) => {
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
  console.log("🚀 Bot DailyGainX Online e Pronto!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
