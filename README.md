
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
- **Resgate:** Manual via Token (DGX-XXXXXX).
- **Recompensa:** 1 USDT no primeiro resgate do indicado (Padrinho recebe bônus).
- **Saque:** Taxa fixa de 3% sobre o valor solicitado.
- **Mínimo de Saque:** 5 USDT.
- **Suporte Oficial:** https://t.me/SuportedailygainX
- **Comunidade:** https://t.me/+81BWkzCKgMdjMDcx
