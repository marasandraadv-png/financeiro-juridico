# ⚖️ Financeiro Jurídico

Sistema de controle financeiro para advogados — entradas/saídas, contas a receber/pagar com baixa, parcelas, exportação Excel e PDF.

## 🚀 Como publicar no Vercel (GRATUITO, 5 minutos)

### Passo 1 — Criar conta no GitHub (se não tiver)
1. Acesse: https://github.com/signup
2. Crie sua conta com email e senha

### Passo 2 — Criar um repositório
1. Acesse: https://github.com/new
2. **Repository name:** `financeiro-juridico`
3. Marque **Public**
4. Clique em **Create repository**

### Passo 3 — Subir os arquivos
1. Na página do repositório recém-criado, clique em **"uploading an existing file"** (link no meio da página)
2. **Arraste TODOS os arquivos e pastas** desta pasta `financeiro-juridico` para a área de upload
   - Importante: não arraste a pasta inteira, abra-a e arraste o que está DENTRO (`src/`, `package.json`, `index.html`, etc.)
3. Aguarde os uploads terminarem (barra verde em cada arquivo)
4. Role até o final da página, clique em **Commit changes**

### Passo 4 — Publicar no Vercel
1. Acesse: https://vercel.com/signup
2. Clique em **Continue with GitHub** e autorize
3. No painel, clique em **Add New → Project**
4. Encontre o repositório `financeiro-juridico` e clique em **Import**
5. Em **Framework Preset**, escolha **Vite** (geralmente já vem auto-detectado)
6. Clique em **Deploy** e aguarde 1-2 minutos
7. ✅ Pronto! Você terá um link tipo: `https://financeiro-juridico-seu-usuario.vercel.app`

### Passo 5 — Adicionar atalho no celular (opcional, recomendado)

**No iPhone (Safari):**
1. Abra o link no Safari
2. Toque no botão de compartilhar (quadrado com seta para cima)
3. Role e toque em **"Adicionar à Tela de Início"**
4. Confirme — vai aparecer um ícone como app na tela inicial

**No Android (Chrome):**
1. Abra o link no Chrome
2. Toque nos 3 pontinhos no canto superior direito
3. Toque em **"Adicionar à tela inicial"**
4. Confirme

---

## 💾 Sobre seus dados

- Todos os dados são salvos **localmente no seu navegador** (privado, não vão para a internet)
- **Cada dispositivo tem seus próprios dados** — se você usar no computador e no celular, são bases separadas
- **Faça backup periódico** pelo menu ⚙️ — exporte um arquivo .json e guarde em local seguro (Google Drive, email, etc.)
- Se trocar de celular ou limpar os dados do navegador, **sem backup você perde tudo**

## 🔄 Sincronizar entre dispositivos

A versão atual usa armazenamento local, então não sincroniza automaticamente. Caminhos práticos:

1. **Use um dispositivo principal** (notebook do escritório, por exemplo) e sempre exporte backup quando lançar coisas importantes
2. Para ver no celular, importe o backup mais recente
3. Se quiser **sincronização automática real** (igual Google Drive), me avise — posso adicionar integração com banco de dados gratuito (Supabase ou Firebase). É um upgrade simples.

---

## 🛠️ Para rodar localmente (opcional, técnico)

```bash
npm install
npm run dev
```

Acessar em http://localhost:5173

Para gerar build de produção:
```bash
npm run build
```

Os arquivos prontos ficam na pasta `dist/`.

---

## 📞 Dúvidas?

Se travar em qualquer passo, tira print e manda — te ajudo na hora.
