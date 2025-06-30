// Caminho do arquivo: src/pages/StorefrontPage.tsx

import { useState, useEffect } from 'react';
import { useStore } from '../lib/StoreContext';
import { useCart } from '../lib/CartContext';
import { supabase } from '../lib/supabaseClient';

// --- Interfaces ---
interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  loja_id: number;
}

export default function StorefrontPage() {
  const { loja } = useStore();
  const { addToCart } = useCart();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  useEffect(() => {
    async function getProdutos() {
      if (!loja) return;
      setLoadingProdutos(true);
      const { data, error } = await supabase
        .from('produtos').select('*').eq('loja_id', loja.id);

      if (error) console.error("Erro ao buscar produtos:", error);
      else setProdutos(data || []);
      setLoadingProdutos(false);
    }
    getProdutos();
  }, [loja]);

  const handleAddToCart = (produto: Produto) => {
    addToCart(produto);
    alert(`${produto.nome} foi adicionado ao carrinho!`);
  };

  return (
    <main className="p-4 md:p-8 w-full max-w-7xl mx-auto">
      {loadingProdutos ? (
        <p className="text-center text-gray-300">Carregando produtos...</p>
      ) : (
        <>
          {produtos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {produtos.map(produto => (
                <div key={produto.id} className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col">
                  <div className="flex-grow mb-4">
                    <h3 className="text-xl font-bold text-white">{produto.nome}</h3>
                    <p className="text-gray-400 my-2 text-sm">{produto.descricao || "Sem descrição."}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-400">R$ {produto.preco.toFixed(2).replace('.', ',')}</span>
                    {/* ESTE É O BOTÃO CORRETO */}
                    <button 
                      onClick={() => handleAddToCart(produto)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Adicionar
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
  );
}