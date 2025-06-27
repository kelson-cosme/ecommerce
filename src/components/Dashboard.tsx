// src/components/Dashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface Loja {
  id: number;
  nome_loja: string;
}

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
}

export default function Dashboard({ session }: { session: Session }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nomeProduto, setNomeProduto] = useState('');
  const [descricaoProduto, setDescricaoProduto] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');

  // Usamos useCallback para evitar recriar a função em cada renderização
  const getDadosDaLoja = useCallback(async () => {
    try {
      setLoading(true);
      const { user } = session;

      // 1. Buscar a loja do usuário logado
      let { data: lojaData, error: lojaError } = await supabase
        .from('lojas')
        .select(`id, nome_loja`)
        .eq('user_id', user.id)
        .single(); // .single() pega um único resultado em vez de um array

      if (lojaError) throw lojaError;
      if (lojaData) {
        setLoja(lojaData);

        // 2. Se a loja foi encontrada, buscar os produtos dela
        let { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('*')
          .eq('loja_id', lojaData.id)
          .order('created_at', { ascending: false }); // Ordena pelos mais novos

        if (produtosError) throw produtosError;
        setProdutos(produtosData || []);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    getDadosDaLoja();
  }, [getDadosDaLoja]);
  
  const handleAddProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProduto || !precoProduto) {
        alert("Nome e preço do produto são obrigatórios.");
        return;
    }
    if (!loja) {
        alert("Não foi possível encontrar sua loja para adicionar o produto.");
        return;
    }

    try {
      const { error } = await supabase
        .from('produtos')
        .insert({
          nome: nomeProduto,
          descricao: descricaoProduto,
          preco: parseFloat(precoProduto),
          loja_id: loja.id // Vincula o produto à loja correta!
        });

      if (error) throw error;
      
      alert('Produto adicionado com sucesso!');
      // Limpa o formulário e recarrega a lista de produtos
      setNomeProduto('');
      setDescricaoProduto('');
      setPrecoProduto('');
      getDadosDaLoja();

    } catch (error: any) {
      alert("Erro ao adicionar produto: " + error.message);
    }
  }

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Painel da Loja: {loja?.nome_loja || 'Carregando...'}</h1>
      <p className="mb-8 text-gray-400">Logado como: {session.user.email}</p>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-4">Adicionar Novo Produto</h2>
        <form onSubmit={handleAddProduto} className="flex flex-col gap-4">
            <input type="text" placeholder="Nome do produto" value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md" required/>
            <textarea placeholder="Descrição do produto" value={descricaoProduto} onChange={e => setDescricaoProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md" />
            <input type="number" step="0.01" placeholder="Preço (ex: 29.99)" value={precoProduto} onChange={e => setPrecoProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md" required/>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 p-2 rounded-md font-bold">Adicionar Produto</button>
        </form>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Seus Produtos</h2>
        {loading ? <p>Carregando...</p> : (
            <ul className="space-y-4">
                {produtos.map(p => (
                    <li key={p.id} className="border-b border-gray-700 pb-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{p.nome}</h3>
                            <p className="text-sm text-gray-400">{p.descricao}</p>
                        </div>
                        <span className="font-bold text-lg text-green-400">R$ {p.preco.toFixed(2)}</span>
                    </li>
                ))}
            </ul>
        )}
        {produtos.length === 0 && !loading && <p>Você ainda não tem produtos cadastrados.</p>}
      </div>

      <button onClick={() => supabase.auth.signOut()} className="mt-8 bg-red-600 hover:bg-red-700 p-2 rounded-md font-bold">
        Sair
      </button>
    </div>
  );
}