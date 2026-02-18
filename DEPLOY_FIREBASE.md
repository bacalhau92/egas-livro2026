# Guia de Deploy no Firebase Hosting (Next.js)

Como o projeto já usa Firebase Firestore, colocar o site no **Firebase Hosting** é uma escolha excelente e integrada.

## 🛠️ Passo 1: Preparação

1. Instale o Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Faça login:

   ```bash
   firebase login
   ```

3. Ative o suporte experimental para Next.js (Web Frameworks):

   ```bash
   firebase experiments:enable webframeworks
   ```

## 🚀 Passo 2: Deploy

Basta rodar o comando:

```bash
firebase deploy
```

*O Firebase detetará automaticamente que é um projeto Next.js, fará o build e criará as Cloud Functions necessárias para o backend (RSVP e Admin).*

---

## 🔐 Configuração de Variáveis de Ambiente

No Firebase Hosting (Web Frameworks), as variáveis de ambiente devem ser configuradas no painel do Google Cloud ou via Cloud Functions, mas como estamos a usar o `firebase-admin` integrado, ele pode herdar as permissões se configurado corretamente.

No entanto, para o **Resend** e **Admin Secret**, você deve adicionar as variáveis no painel do **Google Cloud Run** (que o Firebase cria automaticamente no deploy do Next.js):

1. Vá ao console do [Google Cloud Run](https://console.cloud.google.com/run).
2. Selecione o serviço criado pelo Firebase (ex: `hosting-egas-7eabe`).
3. Clique em **"Edit & Deploy New Revision"**.
4. Procure a aba **"Variables & Secrets"**.
5. Adicione:
   - `RESEND_API_KEY`
   - `ADMIN_SECRET`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

---

## ✅ Vantagens do Firebase Hosting

- **Tudo num só lugar**: O banco de dados (Firestore) e o site ficam no mesmo projeto.
- **Performance**: CDN global do Google.
- **SSL Automático**: Certificado HTTPS gratuito.

---
> [!IMPORTANT]
> Se o comando `firebase deploy` pedir para inicializar o projeto, selecione **Hosting** e escolha **"Use an existing project"** -> `egas-7eabe`.
