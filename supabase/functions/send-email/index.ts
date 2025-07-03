// // Caminho do arquivo: supabase/functions/send-email/index.ts

// import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
// import { Resend } from 'npm:resend@3.4.0'

// // Interface para os dados que a função receberá
// interface CartItem {
//   nome: string;
//   quantity: number; // A propriedade correta é 'quantity'
// }
// interface EmailPayload {
//   tipo: 'confirmacao_cliente' | 'aviso_lojista';
//   dados_pedido: {
//     id: number;
//     total: number;
//     produtos: CartItem[];
//     email_cliente: string;
//     nome_loja: string;
//     // Opcional: email do lojista para o aviso
//     email_lojista?: string;
//   };
// }

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// }

// serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders })
//   }

//   try {
//     const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
//     const payload: EmailPayload = await req.json();
//     const { tipo, dados_pedido } = payload;

//     let subject = '';
//     let htmlBody = '';
//     let toEmail = '';

//     // ---- CORREÇÃO 2: Usando 'p.quantity' em vez de 'p.quantidade' ----
//     const listaProdutosHtml = dados_pedido.produtos
//         .map(p => `<li>${p.quantity}x ${p.nome}</li>`)
//         .join('');

//     // Monta o e-mail de acordo com o tipo
//     if (tipo === 'confirmacao_cliente') {
//       toEmail = dados_pedido.email_cliente;
//       subject = `Confirmação do seu Pedido #${dados_pedido.id} em ${dados_pedido.nome_loja}`;
//       htmlBody = `
//         <h1>Obrigado por comprar conosco!</h1>
//         <p>Olá! Seu pedido #${dados_pedido.id} foi confirmado.</p>
//         <h3>Resumo do Pedido:</h3>
//         <ul>${listaProdutosHtml}</ul>
//         <p><strong>Total: R$ ${dados_pedido.total.toFixed(2)}</strong></p>
//         <p>Atenciosamente, ${dados_pedido.nome_loja}</p>
//       `;
//     } else if (tipo === 'aviso_lojista') {
//       toEmail = dados_pedido.email_lojista || 'seu-email-de-admin@exemplo.com'; // Use um email de fallback
//       subject = `🔔 Novo Pedido Recebido! Pedido #${dados_pedido.id}`;
//       htmlBody = `
//         <h1>Você recebeu um novo pedido!</h1>
//         <p>Pedido #${dados_pedido.id} no valor de R$ ${dados_pedido.total.toFixed(2)} foi pago.</p>
//         <h3>Itens:</h3>
//         <ul>${listaProdutosHtml}</ul>
//         <p><strong>Enviado para:</strong> ${dados_pedido.email_cliente}</p>
//         <p>Acesse seu painel para ver mais detalhes.</p>
//       `;
//     }

//     // ---- CORREÇÃO 1: Use seu domínio verificado no Resend ----
//     // Substitua 'contato@seudominio.com' por um e-mail de um domínio que você
//     // verificou na sua conta do Resend.
//     const fromEmail = 'contato@kemax.store'; 

//     await resend.emails.send({
//       from: `${dados_pedido.nome_loja} <${fromEmail}>`, // Formato recomendado
//       to: toEmail,
//       subject: subject,
//       html: htmlBody,
//     });

//     return new Response(JSON.stringify({ message: "E-mail enviado com sucesso!" }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     });

//   } catch (error) {
//     console.error("Erro ao enviar e-mail:", error);
//     return new Response(JSON.stringify({ error: error.message }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//       status: 400,
//     });
//   }
// });



// Caminho do arquivo: supabase/functions/send-email/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { Resend } from 'npm:resend@3.4.0'

interface CartItem { nome: string; quantity: number; }
interface EmailPayload {
  tipo: 'confirmacao_cliente' | 'aviso_lojista' | 'status_update';
  dados_pedido: {
    id: number;
    total?: number;
    produtos?: CartItem[];
    email_cliente: string;
    nome_loja: string;
    novo_status?: string; // Novo campo para atualização de status
  };
}

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };

serve(async (req) => {
    if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY')!);
    const payload: EmailPayload = await req.json();
    const { tipo, dados_pedido } = payload;

    let subject = '';
    let htmlBody = '';
    const toEmail = dados_pedido.email_cliente;
    const fromEmail = 'contato@kemax.store'; // SUBSTITUA PELO SEU DOMÍNIO VERIFICADO

    if (tipo === 'confirmacao_cliente') {
      const listaProdutosHtml = dados_pedido.produtos?.map(p => `<li>${p.quantity}x ${p.nome}</li>`).join('') || '';
      subject = `Confirmação do seu Pedido #${dados_pedido.id} em ${dados_pedido.nome_loja}`;
      htmlBody = `<h1>Obrigado por comprar conosco!</h1><p>Seu pedido #${dados_pedido.id} foi confirmado.</p><h3>Resumo:</h3><ul>${listaProdutosHtml}</ul><p><strong>Total: R$ ${dados_pedido.total?.toFixed(2)}</strong></p>`;
    } 
    // ---- NOVA LÓGICA PARA ATUALIZAÇÃO DE STATUS ----
    else if (tipo === 'status_update') {
      subject = `Atualização do seu Pedido #${dados_pedido.id}`;
      htmlBody = `<h1>Seu pedido foi atualizado!</h1><p>Olá! O status do seu pedido #${dados_pedido.id} foi atualizado para: <strong>${dados_pedido.novo_status}</strong>.</p><p>Atenciosamente,<br/>${dados_pedido.nome_loja}</p>`;
    } 
    else {
      throw new Error("Tipo de e-mail inválido.");
    }

    await resend.emails.send({
      from: `${dados_pedido.nome_loja} <${fromEmail}>`,
      to: toEmail,
      subject: subject,
      html: htmlBody,
    });

    return new Response(JSON.stringify({ message: "E-mail enviado!" }), { headers: { ...corsHeaders } });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});