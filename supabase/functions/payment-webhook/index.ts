// // Caminho do arquivo: supabase/functions/payment-webhook/index.ts

// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
// import Stripe from 'npm:stripe@15.12.0'
// import { createClient } from 'npm:@supabase/supabase-js@2.44.4'

// // Interface para garantir a tipagem dos itens do carrinho
// interface CartItem {
//   id: number;
//   nome: string;
//   preco: number;
//   quantity: number;
// }

// serve(async (req) => {
//   try {
//     // --- 1. Inicialização Segura dos Clientes ---
//     const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
//       httpClient: Stripe.createFetchHttpClient(),
//     });

//     const supabaseAdmin = createClient(
//         Deno.env.get('SUPABASE_URL')!, 
//         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
//     );
//     const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!;

//     // --- 2. Verificação da Assinatura do Webhook ---
//     const signature = req.headers.get('Stripe-Signature')!;
//     const body = await req.text();
//     const event = await stripe.webhooks.constructEventAsync(body, signature, signingSecret);
    
//     // --- 3. Processamento do Evento de Pagamento ---
//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session;
//       const metadata = session.metadata;

//       if (!metadata || !metadata.loja_id || !metadata.cart_items) {
//         throw new Error('Metadados essenciais (loja_id, cart_items) faltando no evento do Stripe.');
//       }

//       const cartItems: CartItem[] = JSON.parse(metadata.cart_items);
//       const totalPedido = cartItems.reduce((sum, item) => sum + item.preco * item.quantity, 0);
//       const lojaId = parseInt(metadata.loja_id, 10);
      
//       // --- 4. Salvar o Pedido no Banco de Dados ---
//       const { data: pedidoData, error } = await supabaseAdmin.from('pedidos').insert({
//         loja_id: lojaId,
//         total: totalPedido,
//         status: 'pago',
//         stripe_checkout_id: session.id,
//         produtos: cartItems.map(item => ({
//           id: item.id,
//           nome: item.nome,
//           preco: item.preco,
//           quantidade: item.quantity
//         }))
//       }).select().single();

//       if (error) {
//         throw new Error(`Erro ao salvar pedido no Supabase: ${error.message}`);
//       }

//       // --- 5. Disparar os E-mails de Notificação ---
//       if (pedidoData) {
//         const { data: lojaInfo } = await supabaseAdmin.from('lojas').select('nome_loja').eq('id', lojaId).single();
//         const emailCliente = session.customer_details?.email;

//         if (lojaInfo && emailCliente) {
//           const payloadCliente = {
//             tipo: 'confirmacao_cliente',
//             dados_pedido: {
//               id: pedidoData.id,
//               total: totalPedido,
//               produtos: cartItems,
//               email_cliente: emailCliente,
//               nome_loja: lojaInfo.nome_loja,
//             }
//           };
//           // Invoca a função de email para o cliente sem esperar pela resposta
//           supabaseAdmin.functions.invoke('send-email', { body: payloadCliente }).catch(console.error);
          
//           // Opcional: invocar novamente para o lojista
//           const payloadLojista = { ...payloadCliente, tipo: 'aviso_lojista' };
//           supabaseAdmin.functions.invoke('send-email', { body: payloadLojista }).catch(console.error);
//         }
//       }
//     }

//     return new Response(JSON.stringify({ ok: true }), { status: 200 });

//   } catch (error) {
//     console.error('Erro fatal no processamento do webhook:', error.message);
//     return new Response(JSON.stringify({ error: error.message }), { status: 400 });
//   }
// });

// Caminho do arquivo: supabase/functions/payment-webhook/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@15.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2.44.4'

interface CartItem { id: number; nome: string; preco: number; quantity: number; }

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() });
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!;

    const signature = req.headers.get('Stripe-Signature')!;
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, signingSecret);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;
      const emailCliente = session.customer_details?.email;

      if (!metadata || !metadata.loja_id || !metadata.cart_items || !emailCliente) {
        throw new Error('Dados essenciais (loja_id, cart_items, email) faltando no evento do Stripe.');
      }

      const cartItems: CartItem[] = JSON.parse(metadata.cart_items);
      const totalPedido = cartItems.reduce((sum, item) => sum + item.preco * item.quantity, 0);
      const lojaId = parseInt(metadata.loja_id, 10);
      
      const { data: pedidoData, error } = await supabaseAdmin.from('pedidos').insert({
        loja_id: lojaId,
        total: totalPedido,
        status: 'pago',
        stripe_checkout_id: session.id,
        email_cliente: emailCliente, // <-- SALVANDO O E-MAIL AQUI
        produtos: cartItems.map(item => ({ id: item.id, nome: item.nome, preco: item.preco, quantidade: item.quantity }))
      }).select().single();

      if (error) throw new Error(`Erro ao salvar pedido: ${error.message}`);

      if (pedidoData) {
        const { data: lojaInfo } = await supabaseAdmin.from('lojas').select('nome_loja').eq('id', lojaId).single();
        if (lojaInfo) {
          const payload = {
            tipo: 'confirmacao_cliente',
            dados_pedido: { id: pedidoData.id, total: totalPedido, produtos: cartItems, email_cliente: emailCliente, nome_loja: lojaInfo.nome_loja }
          };
          supabaseAdmin.functions.invoke('send-email', { body: payload }).catch(console.error);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    console.error('Erro no webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});