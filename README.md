# DailyGainX - Firebase Studio

Este é um projeto Next.js criado no Firebase Studio.

## Primeiros Passos

Para iniciar, dê uma olhada em `src/app/page.tsx`.

Para rodar o projeto localmente, use o comando:
```bash
npm run dev
```

## Configuração do Firebase

Este projeto utiliza o Firebase para autenticação de usuários. Para que o cadastro com número de telefone funcione, você **precisa** habilitar o provedor de autenticação por telefone no seu projeto Firebase.

Siga estes passos:

1.  Acesse o [Firebase Console](https://console.firebase.google.com/).
2.  Selecione o seu projeto.
3.  No menu à esquerda, navegue até **Authentication**.
4.  Clique na aba **Sign-in method** (Método de login).
5.  Na lista de provedores, encontre e ative a opção **Telefone**.

Sem completar este passo, o envio de SMS para verificação não funcionará e o cadastro de novos usuários falhará.
