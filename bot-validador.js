/**
 * @fileOverview Bot do Telegram para entrega de tokens gerados pelo Admin.
 * 
 * Fluxo:
 * 1. Admin gera token no site vinculado a um ID de transação.
 * 2. Usuário envia o ID para o bot.
 * 3. Bot busca o token na coleção 'tokens_resgate' e entrega ao usuário.
 */

const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Configuração do Firebase Admin com caminho absoluto corrigido
const serviceAccountPath = path.resolve(__dirname, 'firebase-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n❌ ERRO: Arquivo 'firebase-key.json' não encontrado.");
  console.log("👉 Certifique-se de que o arquivo está na raiz do projeto.\n");
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin inicializado.");
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// 2. Configuração do Bot
const BOT_TOKEN = '8705097831:AAGWrokWxz-j1weHLEq7Kei-sRsWKw1xok4';
const bot = new Telegraf(BOT_TOKEN);

// Lógica de Busca e Entrega
const buscarTokenEEntregar = async (ctx, transactionId) => {
  if (!transactionId || transactionId.length < 5) {
    return ctx.reply("⚠️ ID de transação inválido.");
  }

  await ctx.reply(`🔍 Buscando seu código de resgate para o ID: \`${transactionId}\`...`, { parse_mode: 'MarkdownV2' });

  try {
    // Busca na coleção tokens_resgate um token que bata com o transactionId e não tenha sido usado
    const tokensRef = db.collection('tokens_resgate');
    const snapshot = await tokensRef
      .where('transactionId', '==', transactionId)
      .where('usado', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return ctx.reply(
        "❌ *TOKEN NÃO ENCONTRADO OU JÁ RESGATADO*\n\n" +
        "Pode ser que o administrador ainda não tenha validado seu depósito no sistema ou o ID esteja incorreto\.\n\n" +
        "Tente novamente em alguns minutos\.",
        { parse_mode: 'MarkdownV2' }
      );
    }

    const tokenDoc = snapshot.docs[0];
    const data = tokenDoc.data();

    await ctx.reply(
      `✅ *DEPÓSITO ENCONTRADO\!*\n\n` +
      `Seu código de resgate exclusivo é:\n\n` +
      `👉 \`${data.token}\`\n\n` +
      `**COMO USAR:**\n` +
      `1\. Vá no seu **Perfil** no site\.\n` +
      `2\. Clique em **Resgatar Token**\.\n` +
      `3\. Cole o código acima e confirme\.\n\n` +
      `O valor de **${data.valor.toFixed(2)} USDT** será creditado\!`,
      { parse_mode: 'MarkdownV2' }
    );
    
    console.log(`Token ${data.token} entregue para a transação ${transactionId}`);

  } catch (error) {
    console.error("Erro na busca:", error);
    ctx.reply("🚫 Ocorreu um erro técnico. Tente novamente mais tarde.");
  }
};

// Comandos
bot.start(async (ctx) => {
  const payload = ctx.payload; 
  if (payload) {
    await buscarTokenEEntregar(ctx, payload);
  } else {
    ctx.reply(
      "👋 Bem-vindo ao DailyGainX!\n\n" +
      "Se você já fez o Pix e o administrador validou, envie o **ID da Transação** para receber seu código de resgate."
    );
  }
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return;
  await buscarTokenEEntregar(ctx, text);
});

bot.launch().then(() => {
  console.log("🚀 Bot DailyGainX Online - Modo Entregador Ativo!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
