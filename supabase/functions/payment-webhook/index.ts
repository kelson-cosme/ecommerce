// Caminho do arquivo: supabase/functions/payment-webhook/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@15.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2.44.4'

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      httpClient: Stripe.createFetchHttpClient(),
    })
    
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!, 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const signingSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!

    const signature = req.headers.get('Stripe-Signature')!
    const body = await req.text()

    // ---- A CORREÇÃO FINAL ESTÁ AQUI ----
    // Trocamos constructEvent por constructEventAsync
    const event = await stripe.webhooks.constructEventAsync(body, signature, signingSecret);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        throw new Error('Metadados não encontrados na sessão do Stripe.');
      }

      const lojaId = parseInt(metadata.loja_id, 10);
      const total = parseFloat(metadata.produto_preco);
      const produtoId = parseInt(metadata.produto_id, 10);

      if (isNaN(lojaId) || isNaN(total)) {
        throw new Error('Erro ao converter loja_id ou total para número.');
      }
      
      const { error } = await supabaseAdmin.from('pedidos').insert({
        loja_id: lojaId,
        total: total,
        status: 'pago',
        stripe_checkout_id: session.id,
        produtos: [{
          id: produtoId,
          nome: metadata.produto_nome,
          preco: total,
          quantidade: 1
        }]
      });

      if (error) {
        console.error('Erro ao salvar pedido no Supabase:', error);
        throw error;
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
})