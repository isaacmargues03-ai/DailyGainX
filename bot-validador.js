/**
 * @fileOverview Bot do Telegram para validação de depósitos e geração de tokens de resgate.
 * 
 * Funcionalidades:
 * - Suporte a Deep Linking: Captura o ID da transação vindo do link do site.
 * - Validação de Transação: Simula consulta na API PixUp.
 * - Geração de Tokens: Cria códigos de resgate compatíveis com o site.
 */

const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Configuração do Firebase Admin
const serviceAccountPath = path.resolve(__dirname, 'firebase-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n❌ ERRO CRÍTICO: Arquivo 'firebase-key.json' não encontrado na raiz do projeto.");
  console.error("\n👉 COMO CORRIGIR:");
  console.error("1. Vá ao Console do Firebase > Configurações do Projeto > Contas de Serviço.");
  console.error("2. Clique em 'Gerar nova chave privada'.");
  console.error("3. O arquivo será baixado. Renomeie ele para exatamente 'firebase-key.json'.");
  console.error("4. Arraste e solte este arquivo para a pasta raiz deste projeto no painel à esquerda.\n");
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin inicializado com sucesso.");
} catch (error) {
  console.error("❌ Erro ao inicializar o Firebase Admin:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// 2. Configuração do Bot
const BOT_TOKEN = '8705097831:AAGWrokWxz-j1weHLEq7Kei-sRsWKw1xok4';
const bot = new Telegraf(BOT_TOKEN);

// Função para gerar o token no formato DGX-XXXXXX
const gerarTokenDGX = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "DGX-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Lógica de Validação e Geração
const processarValidacao = async (ctx, transactionId) => {
  if (!transactionId || transactionId.length < 5) {
    return ctx.reply("⚠️ ID de transação inválido ou não fornecido.");
  }

  await ctx.reply(`🔍 Verificando transação: \`${transactionId}\`...`, { parse_mode: 'MarkdownV2' });

  try {
    // Simulação de sucesso (Em produção, aqui entraria a consulta à API PixUp)
    const isPaid = true;
    const amountInUsdt = 100.00; // Valor simulado

    if (isPaid) {
      const newToken = gerarTokenDGX();

      // Grava na coleção tokens_resgate (Exatamente como o site espera)
      await db.collection('tokens_resgate').doc(newToken).set({
        token: newToken,
        valor: amountInUsdt,
        usado: false,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: transactionId,
        status: 'active'
      });

      await ctx.reply(
        `✅ *DEPÓSITO VALIDADO\!*\n\n` +
        `Seu código de resgate exclusivo é:\n\n` +
        `👉 \`${newToken}\`\n\n` +
        `**COMO USAR:**\n` +
        `1\. Vá no seu **Perfil** no site\.\n` +
        `2\. Clique em **Resgatar Token**\.\n` +
        `3\. Cole o código acima e confirme\.\n\n` +
        `O valor de **${amountInUsdt.toFixed(2)} USDT** será creditado na hora\!`,
        { parse_mode: 'MarkdownV2' }
      );
      
      console.log(`Token gerado: ${newToken} para transação ${transactionId}`);
    } else {
      ctx.reply("❌ Pagamento não identificado ou ainda pendente. Certifique-se de que o Pix foi concluído.");
    }
  } catch (error) {
    console.error("Erro no processamento:", error);
    ctx.reply("🚫 Ocorreu um erro técnico. Tente novamente em instantes.");
  }
};

// Comando /start - Suporta deep linking: /start ID_TRANSACAO
bot.start(async (ctx) => {
  const payload = ctx.payload; // Captura o ID se vier do link do site
  if (payload) {
    await processarValidacao(ctx, payload);
  } else {
    ctx.reply(
      "👋 Bem-vindo ao validador oficial DailyGainX!\n\n" +
      "Para validar seu depósito, envie o **ID da Transação** gerado no site."
    );
  }
});

// Recebimento manual de texto (ID digitado)
bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (text.startsWith('/')) return; // Ignora outros comandos
  await processarValidacao(ctx, text);
});

// Inicialização
bot.launch().then(() => {
  console.log("🚀 Bot DailyGainX Online e aguardando validações!");
});

// Parada graciosa
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
