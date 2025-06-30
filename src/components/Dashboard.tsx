// Caminho do arquivo: src/components/Dashboard.tsx

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

// --- Interfaces (Tipos de Dados) ---
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
interface Pedido {
  id: number;
  created_at: string;
  status: string;
  total: number;
  produtos: { nome: string; preco: number; quantidade: number }[];
}


export default function Dashboard({ session }: { session: Session }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]); // <-- NOVO: Estado para pedidos
  const [loading, setLoading] = useState(true);
  
  // Estados para o formulário
  const [nomeProduto, setNomeProduto] = useState('');
  const [descricaoProduto, setDescricaoProduto] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');

  // Função para buscar todos os dados da loja
  const getDadosDaLoja = useCallback(async () => {
    try {
      setLoading(true);
      const { user } = session;

      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas').select(`id, nome_loja`).eq('user_id', user.id).single();

      if (lojaError) throw lojaError;

      if (lojaData) {
        setLoja(lojaData);
        // Busca paralela de produtos e pedidos
        const [produtosResponse, pedidosResponse] = await Promise.all([
          supabase.from('produtos').select('*').eq('loja_id', lojaData.id).order('created_at', { ascending: false }),
          supabase.from('pedidos').select('*').eq('loja_id', lojaData.id).order('created_at', { ascending: false })
        ]);

        if (produtosResponse.error) throw produtosResponse.error;
        setProdutos(produtosResponse.data || []);
        
        if (pedidosResponse.error) throw pedidosResponse.error;
        setPedidos(pedidosResponse.data || []);
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
    if (!loja) return;

    try {
      const { error } = await supabase.from('produtos').insert({
          nome: nomeProduto, descricao: descricaoProduto, preco: parseFloat(precoProduto), loja_id: loja.id
      });
      if (error) throw error;
      alert('Produto adicionado!');
      setNomeProduto(''); setDescricaoProduto(''); setPrecoProduto('');
      getDadosDaLoja();
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Painel da Loja: {loja?.nome_loja || 'Carregando...'}</h1>
        <p className="text-gray-400">Logado como: {session.user.email}</p>
      </div>

      {/* Seção de Pedidos */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Últimos Pedidos</h2>
        {loading ? <p>Carregando...</p> : (
            <div className="space-y-4">
              {pedidos.length > 0 ? pedidos.map(pedido => (
                  <div key={pedido.id} className="border-b border-gray-700 pb-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">
                        Pedido de {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <span className="font-bold text-lg text-green-400">R$ {pedido.total.toFixed(2)}</span>
                    </div>
                    <ul className="list-disc list-inside mt-1">
                      {pedido.produtos.map((p, index) => <li key={index} className="text-sm">{p.quantidade}x {p.nome}</li>)}
                    </ul>
                  </div>
              )) : <p>Nenhum pedido recebido ainda.</p>}
            </div>
        )}
      </div>

      {/* Seção de Gerenciamento de Produtos */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Gerenciar Produtos</h2>
        <form onSubmit={handleAddProduto} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
            <input type="text" placeholder="Nome" value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md md:col-span-2" required/>
            <input type="number" step="0.01" placeholder="Preço" value={precoProduto} onChange={e => setPrecoProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md" required/>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 p-2 rounded-md font-bold h-full">Adicionar Produto</button>
            <textarea placeholder="Descrição" value={descricaoProduto} onChange={e => setDescricaoProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md md:col-span-4" />
        </form>
        <h3 className="text-xl font-bold mb-4 border-t border-gray-700 pt-4">Seus Produtos Cadastrados</h3>
        <ul className="space-y-2">
            {produtos.map(p => (
                <li key={p.id} className="flex justify-between items-center">
                    <span>{p.nome}</span> <span className="font-mono">R$ {p.preco.toFixed(2)}</span>
                </li>
            ))}
        </ul>
      </div>

      <button onClick={() => supabase.auth.signOut()} className="mt-4 bg-red-600 hover:bg-red-700 p-2 rounded-md font-bold">
        Sair
      </button>
    </div>
  );
}