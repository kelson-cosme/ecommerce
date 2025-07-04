// Caminho do arquivo: supabase/functions/create-checkout-session/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@15.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2.44.4'

interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantity: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { cartItems, loja_id, dominio } = await req.json() as { cartItems: CartItem[], loja_id: number, dominio: string };

    if (!cartItems || cartItems.length === 0 || !loja_id || !dominio) {
      throw new Error('Dados do carrinho, loja ou domínio faltando.');
    }

    // --- LÓGICA DE PAGAMENTO COM TAXA DE PLATAFORMA ---
    
    // 1. Busca o ID da conta Stripe do lojista no seu banco de dados
    const { data: lojaData, error: lojaError } = await supabaseAdmin
        .from('lojas').select('stripe_account_id').eq('id', loja_id).single();
    
    if (lojaError || !lojaData?.stripe_account_id) {
        throw new Error("A loja não está configurada para receber pagamentos via Stripe Connect.");
    }
    const stripeAccountId = lojaData.stripe_account_id;

    // 2. Mapeia os itens do carrinho para o formato do Stripe
    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'brl',
        product_data: { name: item.nome },
        unit_amount: Math.round(item.preco * 100),
      },
      quantity: item.quantity,
    }));
    
    // 3. Calcula o valor total da compra em centavos
    const totalAmountInCents = cartItems.reduce((sum, item) => sum + (item.preco * 100 * item.quantity), 0);

    // 4. ---- NOVA LÓGICA: CALCULA A SUA TAXA ----
    // Calcula 3% do valor total. Math.round para garantir que seja um número inteiro.
    const applicationFeeAmount = Math.round(totalAmountInCents * 0.03);


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: line_items,
      success_url: `http://${dominio}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${dominio}/carrinho`,
      metadata: {
        loja_id: loja_id,
        cart_items: JSON.stringify(cartItems),
      },
      // ---- NOVA LÓGICA: DIRECIONA O PAGAMENTO E APLICA A TAXA ----
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        // O dinheiro vai para a conta conectada do lojista
        transfer_data: {
          destination: stripeAccountId,
        },
      },
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