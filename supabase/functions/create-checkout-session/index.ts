// Caminho do arquivo: supabase/functions/create-checkout-session/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@15.12.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantity: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { cartItems, loja_id, dominio } = await req.json() as { cartItems: CartItem[], loja_id: number, dominio: string };

    if (!cartItems || cartItems.length === 0 || !loja_id || !dominio) {
      throw new Error('Dados do carrinho, loja ou domínio faltando.');
    }

    // Mapeia os itens do carrinho para o formato que o Stripe espera
    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.nome,
        },
        unit_amount: Math.round(item.preco * 100),
      },
      quantity: item.quantity,
    }));
    
    // Converte os itens do carrinho para uma string para salvar nos metadados
    const cartItemsString = JSON.stringify(cartItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: line_items, // Passa a lista de itens
      success_url: `http://${dominio}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${dominio}/carrinho`, // Volta para o carrinho se cancelar
      metadata: {
        loja_id: loja_id,
        // Salva todos os itens do carrinho como uma string nos metadados
        cart_items: cartItemsString,
      }
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});