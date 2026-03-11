
# DailyGainX - Firebase Studio

Este é um projeto Next.js criado no Firebase Studio com integração real da PixUp.

## Erro de Autenticação (Git Push)

Se você receber o erro `Authentication failed` ao dar push, siga estes passos:
1. Verifique se você tem permissão de escrita no repositório.
2. No terminal, tente configurar seu usuário:
   ```bash
   git config --global user.email "seu-email@gmail.com"
   git config --global user.name "Seu Nome"
   ```
3. Se o erro persistir, você pode precisar usar um **Personal Access Token (PAT)** do GitHub em vez da senha.

## Comandos do Terminal

Para atualizar e sincronizar com o GitHub:
```bash
git add .
git commit -m "Sua mensagem de atualização aqui"
git push
```

## Configuração do Webhook

Cadastre a URL abaixo no painel da PixUp para que o saldo atualize automaticamente:
`https://dailygainx.netlify.app/api/webhook/pixup`

**Regras de Negócio Atualizadas:**
- **Conversão:** R$ 25,00 = 5 USDT (R$ 1,00 = 0.20 USDT).
- **Resgate:** Manual via Token (DGX-XXXXXX).
- **Suporte Oficial:** https://t.me/SuportedailygainX
- **Comunidade:** https://t.me/+81BWkzCKgMdjMDcx
