
# DailyGainX - Firebase Studio

Este é um projeto Next.js criado no Firebase Studio com integração real da PixUp.

## Comandos do Terminal

Para atualizar e sincronizar com o GitHub:
```bash
git add .
git commit -m "Sua mensagem de atualização aqui"
git push
```

Para rodar o projeto localmente:
```bash
npm run dev
```

## Configuração do Webhook

Cadastre a URL abaixo no painel da PixUp para que o saldo atualize automaticamente:
`https://dailygainx.netlify.app/api/webhook/pixup`

**Regras de Negócio Atualizadas:**
- **Conversão:** R$ 25,00 = 5 USDT (R$ 1,00 = 0.20 USDT).
- **Crédito:** Automático via Webhook (Server-side) ou Resgate Manual via Token.
- **Recompensa:** 1 USDT no primeiro depósito do indicado.
- **Saque:** Taxa fixa de 3% sobre o valor solicitado.
- **Suporte:** https://t.me/SuportedailygainX
