// Caminho do arquivo: src/pages/StorefrontPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/StoreContext';
import { supabase } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

// --- Interfaces ---
interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

// --- Configuração do Stripe ---
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StorefrontPage() {
  const { loja, loading: loadingLoja } = useStore(); // Pega a loja e o status de carregamento dela
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState<number | null>(null); // Armazena o ID do produto em checkout

  useEffect(() => {
    async function getProdutos() {
      if (!loja) return;

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
    
    if (!loadingLoja) { // Só busca produtos se a loja já foi carregada
      getProdutos();
    }
  }, [loja, loadingLoja]);

  const handleCheckout = async (produto: Produto) => {
    // Validação crucial para garantir que a loja foi carregada
    if (!loja) {
        alert("A informação da loja ainda não foi carregada. Tente novamente em um instante.");
        return;
    }

    setIsCheckingOut(produto.id); // Desabilita o botão do produto específico

    // **PASSO DE DEPURAÇÃO**: Veja no console o que você está enviando.
    const checkoutData = { 
        produto: produto,
        loja_id: loja.id,
        dominio: window.location.host 
    };
    console.log("Enviando para o checkout:", checkoutData);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: checkoutData,
      });

      // Se a função retornar um erro, ele será mostrado aqui
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const stripe = await stripePromise;
      if (stripe && data.sessionId) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error('Não foi possível obter a sessão do Stripe.');
      }

    } catch (err: any) {
        console.error('Erro ao criar sessão de checkout:', err);
        alert(`Não foi possível iniciar o pagamento: ${err.message}`);
    } finally {
        setIsCheckingOut(null); // Reabilita o botão
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
        {(loadingLoja || loadingProdutos) ? (
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
                        disabled={isCheckingOut === produto.id} // Desabilita apenas este botão
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                        {isCheckingOut === produto.id ? 'Aguarde...' : 'Comprar'}
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