
# DailyGainX - Instruções para Erro de Autenticação (Git Push)

Se você estiver recebendo o erro `Authentication failed` no terminal ao tentar dar push, o GitHub está recusando sua senha comum. Você deve usar um **Personal Access Token (PAT)**.

## 🚀 SOLUÇÃO DEFINITIVA (Copie e cole no terminal)

Execute este comando substituindo `SEU_TOKEN_AQUI` pelo token que você gerou no GitHub:

```bash
git remote set-url origin https://isaacmargues03-ai:SEU_TOKEN_AQUI@github.com/isaacmargues03-ai/DailyGainX.git
git push -u origin main
```

---

## Como gerar o Token se ainda não tem:
1. Vá em [GitHub Settings > Tokens (classic)](https://github.com/settings/tokens).
2. Clique em **Generate new token (classic)**.
3. Dê um nome (ex: "Terminal") e marque a caixinha **'repo'**.
4. Copie o código gerado (ele só aparece uma vez).

---

**Status da Plataforma:**
- **Depósito:** 100% Manual (Instruções + Suporte Direto).
- **Resgate:** Via Token DGX (Sistema de Cupons).
- **Indicação:** 1 USDT por novo usuário ativo.
- **Webhook:** `https://dailygainx.netlify.app/api/webhook/pixup`
