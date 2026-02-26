
/**
 * @fileOverview Bot do Telegram para validação de Pix e geração de tokens DGX.
 * 
 * Este bot simula a validação na PixUp, gera um token DGX-XXXXXX e salva
 * no Firestore para que o usuário possa resgatá-lo no site.
 */

const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// 1. Configuração do Firebase Admin com caminho absoluto da raiz
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n❌ ERRO CRÍTICO: Arquivo 'firebase-key.json' não encontrado na raiz do projeto.");
  console.log("\n👉 COMO CORRIGIR:");
  console.log("1. Vá ao Console do Firebase > Configurações do Projeto > Contas de Serviço.");
  console.log("2. Clique em 'Gerar nova chave privada'.");
  console.log("3. O arquivo será baixado. Renomeie ele para exatamente 'firebase-key.json'.");
  console.log("4. Arraste e solte este arquivo para a pasta raiz deste projeto.\n");
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log("✅ Firebase Admin inicializado com sucesso.");
} catch (error) {
  console.error("❌ Erro ao processar arquivo de chaves:", error.message);
  process.exit(1);
}

const db = admin.firestore();

// 2. Credenciais do Bot e da Conta Admin
const BOT_TOKEN = '8705097831:AAGWrokWxz-j1weHLEq7Kei-sRsWKw1xok4';
const ADMIN_EMAIL = 'isaacmargues03@gmail.com'; 
const bot = new Telegraf(BOT_TOKEN);

// Função para gerar o token no mesmo padrão da sua plataforma
const gerarTokenDGX = () => "DGX-" + Math.random().toString(36).substring(2, 8).toUpperCase();

bot.start((ctx) => {
    ctx.reply(
        "👋 Bem-vindo ao Sistema DailyGainX!\n\n" +
        "Envie o **ID da Transação** do seu Pix para gerar seu código de resgate exclusivo."
    );
});

bot.on('text', async (ctx) => {
    const transactionId = ctx.message.text.trim();

    // Filtra comandos
    if (transactionId.startsWith('/')) return;

    if (transactionId.length < 5) {
        return ctx.reply("⚠️ ID de transação muito curto ou inválido.");
    }

    ctx.reply("⏳ Verificando seu pagamento nos sistemas PixUp...");

    try {
        // 3. Simulação de Consulta (Em produção, aqui entraria a chamada de API da PixUp via axios)
        const pagoConfirmado = true; // Simulação de sucesso

        if (pagoConfirmado) {
            const novoToken = gerarTokenDGX();
            const valorTransacao = 100.00; // Valor simulado de 100 USDT

            // 4. Gravação no Firestore (Padronizado com o site)
            await db.collection('tokens_resgate').doc(novoToken).set({
                token: novoToken,
                valor: valorTransacao,
                usado: false,
                geradoPor: ADMIN_EMAIL, 
                transactionId: transactionId,
                dataCriacao: admin.firestore.FieldValue.serverTimestamp()
            });

            ctx.reply(
                `✅ **PAGAMENTO CONFIRMADO!**\n\n` +
                `Seu Token de Resgate é:\n` +
                `👉 \`${novoToken}\`\n\n` +
                `**COMO RESGATAR:**\n` +
                `1. Acesse seu perfil no site.\n` +
                `2. Clique em **Resgatar Token**.\n` +
                `3. Cole o código acima.\n\n` +
                `Valor: **${valorTransacao.toFixed(2)} USDT**`,
                { parse_mode: 'Markdown' }
            );
            
            console.log(`Token ${novoToken} gerado via Bot para transação ${transactionId}`);
        } else {
            ctx.reply("❌ Depósito não encontrado ou ainda em processamento pela PixUp. Tente novamente em instantes.");
        }
    } catch (error) {
        console.error("Erro no processamento do bot:", error);
        ctx.reply("🚫 Ocorreu um erro técnico ao validar sua transação. Por favor, contate o suporte.");
    }
});

bot.launch().then(() => {
  console.log("🚀 Bot DailyGainX Online - Privilégios Admin Ativos!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
