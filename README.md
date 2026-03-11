
# DailyGainX - Instruções para Erro de Autenticação (Git Push)

Se você estiver recebendo o erro `Authentication failed` ao tentar dar push no terminal, siga estas instruções para configurar suas credenciais do GitHub.

## Opção 1: Configurar Nome e Email
No terminal, execute os comandos abaixo substituindo pelos seus dados reais:
```bash
git config --global user.email "seu-email@exemplo.com"
git config --global user.name "Seu Nome de Usuário GitHub"
```

## Opção 2: Usar Personal Access Token (PAT)
O GitHub não aceita mais a sua senha normal no terminal. Se ele pedir senha, você deve usar um **token**.
1. Vá em [GitHub Settings > Developer Settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens).
2. Gere um novo token com permissão de `repo`.
3. No terminal, quando pedir senha, cole esse token.

## Opção 3: Forçar URL com Token (Cuidado: Senha Exposta no Histórico)
Se as opções acima falharem, você pode tentar:
```bash
git remote set-url origin https://SEU_USUARIO:SEU_TOKEN@github.com/isaacmargues03-ai/DailyGainX.git
git push
```

## Webhook PixUp
URL para cadastro no painel: `https://dailygainx.netlify.app/api/webhook/pixup`

---

**Status Atual:**
- Página de Depósito: Modo Manual (Instruções + Suporte).
- Resgate: Via Token DGX.
- Bônus: 1 USDT por indicação ativa.
