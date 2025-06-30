// supabase/functions/create-checkout-session/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

// Estes são os cabeçalhos CORS que vamos adicionar
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permite qualquer origem. Para produção, você pode restringir a 'https://seusite.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pega a chave secreta que configuramos no painel do Supabase
const stripe = new Stripe(Deno.env.get(import.meta.env.VITE_STRIPE_SECRET_KEY)!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  // CORREÇÃO: Trata a requisição "preflight" OPTIONS do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { produto, dominio } = await req.json()

    if (!produto || !dominio) {
      throw new Error('Informações do produto ou domínio faltando.')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: produto.nome,
            },
            unit_amount: Math.round(produto.preco * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://${dominio}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${dominio}/`,
    })

    return new Response(JSON.stringify({ sessionId: session.id }), {
      // CORREÇÃO: Adiciona os headers CORS na resposta de sucesso também
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      // CORREÇÃO: Adiciona os headers CORS na resposta de erro também
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})