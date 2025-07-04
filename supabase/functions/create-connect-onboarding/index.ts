// supabase/functions/create-connect-onboarding/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@15.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2.44.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }
  try {
    const { loja_id, dominio } = await req.json();
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 1. Busca os dados da loja, incluindo o ID da conta Stripe se já existir
    const { data: lojaData, error: lojaError } = await supabaseAdmin
        .from('lojas').select('stripe_account_id').eq('id', loja_id).single();
    if (lojaError) throw lojaError;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() });
    let accountId = lojaData.stripe_account_id;

    // 2. Se a loja ainda não tem uma conta Stripe, cria uma
    if (!accountId) {
        const account = await stripe.accounts.create({
            type: 'standard', // A conta Standard é a ideal para o Brasil
        });
        accountId = account.id;
        // Salva o novo ID da conta na sua tabela de lojas
        await supabaseAdmin.from('lojas').update({ stripe_account_id: accountId }).eq('id', loja_id);
    }

    // 3. Cria um link de onboarding para o lojista
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `http://${dominio}/admin`, // Para onde voltar se o link expirar
        return_url: `http://${dominio}/admin`,  // Para onde voltar após o sucesso
        type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders } });
  }
})