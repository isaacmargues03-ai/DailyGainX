/**
 * @fileOverview Bot do Telegram para validação de depósitos e geração de tokens de resgate.
 * 
 * Dependências necessárias: telegraf, firebase-admin, axios
 */

const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// 1. Configuração do Firebase Admin
// O arquivo firebase-key.json DEVE estar na raiz do projeto.
const serviceAccountPath = path.resolve(__dirname, 'firebase-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ ERRO CRÍTICO: Arquivo 'firebase-key.json' não encontrado na raiz do projeto.");
  console.error("👉 COMO CORRIGIR:");
  console.error("1. Vá ao Console do Firebase > Configurações do Projeto > Contas de Serviço.");
  console.error("2. Clique em 'Gerar nova chave privada'.");
  console.error("3. Renomeie o arquivo baixado para 'firebase-key.json'.");
  console.error("4. Faça o upload dele para a raiz deste projeto no IDX.");
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

// 2. Configuração do Bot (Token oficial do print)
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

// Comando inicial
bot.start((ctx) => {
  ctx.reply(
    "👋 Bem-vindo ao validador oficial DailyGainX!\n\n" +
    "Para validar seu depósito e receber seu saldo, por favor, envie o **ID da Transação** gerado no site."
  );
});

// Lógica de recebimento de mensagens (ID da Transação)
bot.on('text', async (ctx) => {
  const transactionId = ctx.message.text.trim();

  // Validação básica do formato do ID
  if (transactionId.length < 8) {
    return ctx.reply("⚠️ O ID enviado parece ser muito curto. Por favor, verifique o código da transação no seu histórico ou tela de depósito.");
  }

  ctx.reply("🔍 Verificando seu pagamento nos servidores da PixUp...");

  try {
    /**
     * LOGICA DE VALIDAÇÃO REAL (SIMULADA)
     * No futuro, você pode integrar com a API real da PixUp usando axios.
     */
    const isPaid = true; // Simulação: Sempre aprovando para teste
    const amountInUsdt = 100.00; // Valor fixo de exemplo (100 USDT)

    if (isPaid) {
      const newToken = gerarTokenDGX();

      // Grava na coleção tokens_resgate (Alinhado com o site)
      await db.collection('tokens_resgate').doc(newToken).set({
        token: newToken,
        valor: amountInUsdt,
        usado: false,
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: transactionId,
        status: 'active'
      });

      ctx.reply(
        `✅ DEPÓSITO VALIDADO!\n\n` +
        `Seu código de resgate exclusivo é:\n\n` +
        `👉 \`${newToken}\`\n\n` +
        `**COMO USAR:**\n` +
        `1. Vá no seu **Perfil** no site.\n` +
        `2. Clique em **Resgatar Token**.\n` +
        `3. Cole o código acima e confirme.\n\n` +
        `O valor de **${amountInUsdt.toFixed(2)} USDT** será creditado na hora!`
      );
      
      console.log(`Token gerado: ${newToken} para transação ${transactionId}`);

    } else {
      ctx.reply("❌ Pagamento não identificado ou ainda pendente. Certifique-se de que o Pix foi concluído.");
    }

  } catch (error) {
    console.error("Erro no processamento do bot:", error);
    ctx.reply("🚫 Ocorreu um erro técnico ao validar sua transação. Por favor, tente novamente em instantes ou contate o suporte.");
  }
});

// Inicialização do Bot
bot.launch().then(() => {
  console.log("🚀 Bot DailyGainX Online e aguardando validações!");
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
