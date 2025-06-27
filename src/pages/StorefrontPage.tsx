// src/pages/StorePage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface Loja {
  nome_loja: string;
}

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

export default function StorePage() {
  const { storeId } = useParams<{ storeId: string }>(); // Pega o ID da URL
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getStoreData() {
      if (!storeId) return;
      try {
        setLoading(true);

        // Busca dados da loja
        const { data: lojaData, error: lojaError } = await supabase
          .from('lojas')
          .select('nome_loja')
          .eq('id', storeId)
          .single();

        if (lojaError) throw lojaError;
        if (lojaData) setLoja(lojaData);

        // Busca produtos da loja
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('*')
          .eq('loja_id', storeId);

        if (produtosError) throw produtosError;
        if (produtosData) setProdutos(produtosData);

      } catch (error: any) {
        console.error("Erro ao buscar dados da loja:", error);
      } finally {
        setLoading(false);
      }
    }
    getStoreData();
  }, [storeId]);

  if (loading) return <p className="text-center text-white text-2xl">Carregando loja...</p>;
  if (!loja) return <p className="text-center text-white text-2xl">Loja não encontrada.</p>;

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <Link to="/" className="text-purple-400 hover:underline mb-8 block">&larr; Voltar para todas as lojas</Link>
      <h1 className="text-5xl font-bold mb-8 text-center text-white">{loja.nome_loja}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {produtos.map(produto => (
          <div key={produto.id} className="bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col">
            {/* Aqui você pode adicionar a imagem do produto no futuro */}
            <div className="flex-grow">
              <h3 className="text-xl font-bold text-white">{produto.nome}</h3>
              <p className="text-gray-400 my-2">{produto.descricao}</p>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-2xl font-bold text-green-400">R$ {produto.preco.toFixed(2)}</span>
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Comprar
              </button>
            </div>
          </div>
        ))}
      </div>
      {produtos.length === 0 && <p className="text-center text-white mt-8">Esta loja ainda não tem produtos.</p>}
    </div>
  );
}