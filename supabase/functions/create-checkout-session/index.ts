// Caminho: supabase/functions/create-checkout-session/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
}

interface Produto { id: number; nome: string; preco: number; }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    const { produto, loja_id, dominio } = await req.json() as { produto: Produto, loja_id: number, dominio: string };

    if (!produto || !loja_id || !dominio) {
      throw new Error('Informações do produto, loja ou domínio faltando.')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price_data: { currency: 'brl', product_data: { name: produto.nome }, unit_amount: Math.round(produto.preco * 100) }, quantity: 1 }],
      success_url: `http://${dominio}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${dominio}/`,
      // ---- ESTA É A PARTE MAIS IMPORTANTE ----
      metadata: {
        loja_id: loja_id,
        produto_id: produto.id,
        produto_nome: produto.nome,
        produto_preco: produto.preco
      }
    })

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})