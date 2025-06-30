// Caminho do arquivo: src/pages/StorefrontPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/StoreContext';
import { useCart } from '../lib/CartContext';
import { supabase } from '../lib/supabaseClient';

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  loja_id: number;
  imagem_principal_url?: string; // Campo vindo da nossa View
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
      // Consultando a nova View em vez da tabela 'produtos'
      const { data, error } = await supabase
        .from('produtos_com_imagem_principal')
        .select('*')
        .eq('loja_id', loja.id)
        .order('created_at', { ascending: false });

      if (error) console.error("Erro ao buscar produtos:", error);
      else setProdutos(data as Produto[] || []);
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
                <Link 
                  key={produto.id} 
                  to={`/produto/${produto.id}`}
                  className="bg-gray-800 rounded-lg shadow-lg flex flex-col transition-transform hover:scale-105 group"
                >
                  <div className="w-full h-48 bg-gray-700 rounded-t-lg overflow-hidden">
                    {produto.imagem_principal_url ? (
                      <img
                        src={`${produto.imagem_principal_url}?format=webp&resize=smart&quality=75`}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">Sem Imagem</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300">{produto.nome}</h3>
                    <p className="text-gray-400 my-2 text-sm line-clamp-2 flex-grow">{produto.descricao || "Sem descrição."}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xl font-bold text-green-400">R$ {produto.preco.toFixed(2).replace('.', ',')}</span>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleAddToCart(produto); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded z-10 text-sm"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </Link>
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