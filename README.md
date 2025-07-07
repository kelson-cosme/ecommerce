# Plataforma E-commerce Multi-Tenant

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/SupaBase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=stripe&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 🚀 Sobre o Projeto

Este projeto é uma plataforma de e-commerce multi-tenant (multi-lojas) completa, construída do zero. O modelo de negócio permite que um administrador crie e gerencie múltiplas lojas virtuais para diferentes clientes, onde cada loja opera sob seu próprio domínio customizado.

A aplicação é "consciente do domínio", identificando qual loja exibir com base na URL acessada pelo usuário final. Ela inclui um painel de administração completo para cada lojista gerenciar seus produtos, pedidos e configurações.

---

## ✨ Funcionalidades Principais

-   **Arquitetura Multi-Tenant:** Uma única base de código que serve um número ilimitado de lojas, cada uma com seu próprio domínio.
-   **Painel de Administração do Lojista:**
    -   Autenticação segura de usuários com Supabase Auth.
    -   Gestão completa de produtos (CRUD - Criar, Ler, Atualizar, Deletar).
    -   Upload de múltiplas imagens por produto com otimização para WebP via Supabase Storage.
    -   Criação e gestão de variantes de produtos (ex: Tamanho, Cor).
    -   Visualização e gestão de status de pedidos (ex: Pago, Enviado, Entregue).
-   **Vitrine para o Consumidor Final:**
    -   Página de detalhes de produto com galeria de imagens.
    -   Carrinho de compras funcional e persistente (usando `localStorage` e React Context).
-   **Fluxo de Pagamento Completo:**
    -   Integração segura com **Stripe Connect** para direcionar pagamentos para contas de lojistas individuais.
    -   Cálculo e aplicação automática de taxa de plataforma por transação.
-   **Notificações Automáticas por Email:**
    -   Utiliza **Resend** para enviar e-mails transacionais.
    -   Confirmação de pedido para o cliente.
    -   Aviso de novo pedido para o lojista (a ser implementado).

---

## 🛠️ Tecnologias Utilizadas

-   **Frontend:**
    -   [React](https://react.dev/) com [Vite](https://vitejs.dev/)
    -   [TypeScript](https://www.typescriptlang.org/)
    -   [Tailwind CSS](https://tailwindcss.com/) para estilização
    -   [React Router](https://reactrouter.com/) para gerenciamento de rotas
-   **Backend & Banco de Dados:**
    -   [Supabase](https://supabase.com/)
        -   **Database:** PostgreSQL para armazenamento de dados.
        -   **Auth:** Gerenciamento de autenticação de usuários (lojistas).
        -   **Storage:** Armazenamento de imagens de produtos com otimização on-the-fly.
        -   **Edge Functions:** Lógica de backend para integrações seguras com APIs (Stripe, Resend).
-   **Pagamentos:**
    -   [Stripe Connect](https://stripe.com/connect) para processamento de pagamentos e direcionamento de fundos.
-   **E-mails Transacionais:**
    -   [Resend](https://resend.com/)

---

## ⚙️ Configuração do Ambiente de Desenvolvimento

Para rodar este projeto localmente, siga os passos abaixo:

### Pré-requisitos

-   Node.js (versão 18 ou superior)
-   npm ou yarn
-   Supabase CLI (siga as instruções de instalação [aqui](https://supabase.com/docs/guides/cli))

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/kelson-cosme/ecommerce.git](https://github.com/kelson-cosme/ecommerce.git)
    cd seu-repositorio
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    -   Crie um arquivo chamado `.env.local` na raiz do projeto.
    -   Copie o conteúdo do arquivo `.env.example` abaixo e cole no seu `.env.local`, preenchendo com suas próprias chaves.

    **.env.example**
    ```env
    # Chaves do seu projeto Supabase (Settings > API)
    VITE_SUPABASE_URL="https://SEU_PROJECT_ID.supabase.co"
    VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON"

    # Chave publicável do seu projeto Stripe (Developers > API Keys)
    VITE_STRIPE_PUBLISHABLE_KEY="pk_test_SUA_CHAVE"
    ```

4.  **Configure os Segredos do Supabase:**
    -   Faça login na sua conta Supabase via CLI: `supabase login`
    -   Vincule seu projeto local ao projeto remoto: `supabase link --project-ref SEU_PROJECT_ID`
    -   Configure os segredos que serão usados pelas Edge Functions. Você pode fazer isso pelo painel do Supabase em **Project Settings > Edge Functions** ou via CLI:
        ```bash
        supabase secrets set RESEND_API_KEY="re_SUA_CHAVE"
        supabase secrets set STRIPE_SECRET_KEY="sk_test_SUA_CHAVE"
        supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET="whsec_SUA_CHAVE"
        ```

5.  **Rode o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:5173`.

---

## 📜 Licença

Este projeto é de código aberto e está licenciado sob a Licença MIT.
