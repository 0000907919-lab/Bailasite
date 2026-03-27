# Bailla Backend — Deploy no Vercel

## O que é isso?
Backend simples que recebe produto + frete do site e cria o pagamento no Mercado Pago automaticamente.

---

## PASSO 1 — Pegar o Access Token do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Clique em "Suas integrações" ou "Credenciais"
3. Escolha sua conta
4. Copie o **Access Token de PRODUÇÃO** (começa com `APP_USR-...`)

⚠️ NÃO é o link de pagamento — é a chave secreta da API.

---

## PASSO 2 — Subir o backend no Vercel

### Opção A — Pelo site do Vercel (mais fácil)
1. Crie conta em: https://vercel.com (pode entrar com GitHub)
2. Clique em "Add New Project"
3. Escolha "Import Git Repository" — sobe esses arquivos num repositório novo no GitHub
4. Clique em Deploy

### Opção B — Upload direto
1. Vai em vercel.com
2. Clique em "Add New" → "Project"
3. Escolha "Deploy from template" → depois "Import"

---

## PASSO 3 — Configurar o Token (IMPORTANTE)

Depois do deploy, no painel do Vercel:
1. Clique no seu projeto
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - **Name:** `MP_TOKEN`
   - **Value:** `APP_USR-xxxxxxx...` (seu Access Token)
4. Clique em Save
5. Vá em **Deployments** e clique em **Redeploy**

---

## PASSO 4 — Atualizar o site

No arquivo `confirmOrder-novo.js`, copie o conteúdo e substitua a função `confirmOrder` no seu `app.js`.

Troque essa linha:
```js
const BACKEND_URL = 'https://SEU-PROJETO.vercel.app/api/criar-pagamento';
```
Pela URL real que o Vercel te deu, tipo:
```js
const BACKEND_URL = 'https://bailla-backend.vercel.app/api/criar-pagamento';
```

---

## PASSO 5 — Testar

1. Abra o site
2. Adicione um produto
3. Calcule o frete
4. Clique em "confirmar pedido"
5. Deve abrir o checkout do Mercado Pago com produto + frete separados ✅

---

## Estrutura dos arquivos

```
bailla-backend/
├── api/
│   └── criar-pagamento.js   ← backend principal
├── package.json
├── vercel.json
├── confirmOrder-novo.js     ← cola no app.js do site
└── README.md
```

---

## Dúvidas comuns

**"CORS error" no console** → o CORS já está liberado no backend, mas verifique se a URL do BACKEND_URL está correta.

**"Token não configurado"** → você não adicionou o MP_TOKEN nas variáveis de ambiente do Vercel.

**"Erro ao criar pagamento"** → o Access Token pode estar errado ou ser de teste (sandbox). Use o de produção.
