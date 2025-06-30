// src/pages/StorefrontPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/StoreContext';
import { supabase } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

// --- Interfaces (Tipos de Dados) ---
interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

// --- Configuração do Stripe ---
// Coloque sua Chave Publicável do Stripe aqui. Ela é segura para estar no frontend.
// Lembre-se que ela começa com "pk_test_...".
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);


export default function StorefrontPage() {
  const { loja } = useStore(); // Pega a loja atual do nosso contexto
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false); // Estado para o loading do botão

  // Efeito para buscar os produtos sempre que a loja do contexto for identificada
  useEffect(() => {
    async function getProdutos() {
      if (!loja) return; // Se a loja não foi carregada, não faz nada

      try {
        setLoadingProdutos(true);
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('loja_id', loja.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setProdutos(data);

      } catch (error: any) {
        console.error("Erro ao buscar produtos:", error.message);
      } finally {
        setLoadingProdutos(false);
      }
    }
    
    getProdutos();
  }, [loja]); // Dependência: Roda a função quando o objeto 'loja' estiver disponível

  // Função para iniciar o checkout do Stripe
  const handleCheckout = async (produto: Produto) => {
    setIsCheckingOut(true);
    try {
      // Chama a nossa Edge Function segura no Supabase
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: { 
              produto: produto,
              dominio: window.location.host 
          },
      });

      if (error) throw new Error(`Erro da Edge Function: ${error.message}`);
      
      const stripe = await stripePromise;
      if (stripe && data.sessionId) {
          // Redireciona o cliente para a página de pagamento do Stripe
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error('Não foi possível obter a sessão do Stripe.');
      }

    } catch (err: any) {
        console.error('Erro ao criar sessão de checkout:', err);
        alert('Não foi possível iniciar o pagamento. Tente novamente mais tarde.');
    } finally {
        setIsCheckingOut(false);
    }
  };


  return (
    <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{loja?.nome_loja}</h1>
        <Link to="/admin" className="text-purple-400 hover:text-purple-300 transition-colors">
          Painel do Lojista &rarr;
        </Link>
      </header>
      
      <main>
        {loadingProdutos ? (
          <p className="text-center text-gray-300">Carregando produtos...</p>
        ) : (
          <>
            {produtos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {produtos.map(produto => (
                  <div key={produto.id} className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col transition-transform hover:scale-105">
                    <div className="flex-grow mb-4">
                      <h3 className="text-xl font-bold text-white">{produto.nome}</h3>
                      <p className="text-gray-400 my-2 text-sm">{produto.descricao || "Sem descrição."}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-400">R$ {produto.preco.toFixed(2).replace('.', ',')}</span>
                      <button 
                        onClick={() => handleCheckout(produto)} 
                        disabled={isCheckingOut}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                        {isCheckingOut ? 'Aguarde...' : 'Comprar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center mt-16">
                <p className="text-2xl text-gray-400">Em breve!</p>
                <p className="text-gray-500">Esta loja ainda não tem produtos cadastrados.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}