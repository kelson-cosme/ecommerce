// Caminho do arquivo: supabase/functions/payment-webhook/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@15.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2.44.4'

interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantity: number;
}

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!;

    const signature = req.headers.get('Stripe-Signature')!;
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, signingSecret);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata || !metadata.loja_id || !metadata.cart_items) {
        throw new Error('Metadados essenciais faltando no evento do Stripe.');
      }

      // Converte a string de itens do carrinho de volta para um objeto
      const cartItems: CartItem[] = JSON.parse(metadata.cart_items);

      // Calcula o total do pedido com base nos itens recebidos
      const totalPedido = cartItems.reduce((sum, item) => sum + item.preco * item.quantity, 0);
      
      const { error } = await supabaseAdmin.from('pedidos').insert({
        loja_id: parseInt(metadata.loja_id, 10),
        total: totalPedido,
        status: 'pago',
        stripe_checkout_id: session.id,
        // Salva o array de produtos completo
        produtos: cartItems.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantity
        }))
      });

      if (error) {
        throw new Error(`Erro ao salvar pedido no Supabase: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});