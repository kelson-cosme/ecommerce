// Caminho do arquivo: src/components/Dashboard.tsx

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Modal from './Modal';

// --- Interfaces ---
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

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function Dashboard({ session }: { session: Session }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nomeProduto, setNomeProduto] = useState('');
  const [descricaoProduto, setDescricaoProduto] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

  // ---- CORREÇÃO NO useCallback ----
  // A função agora só depende da 'session', que é o que realmente define os dados a serem buscados.
  const getDadosDaLoja = useCallback(async () => {
    try {
      setLoading(true); // Ativa o loading no início da busca.
      const { user } = session;

      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas').select(`id, nome_loja`).eq('user_id', user.id).single();

      if (lojaError) throw lojaError;

      if (lojaData) {
        setLoja(lojaData);
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
      setLoading(false); // Desativa o loading no final, independente de sucesso ou erro.
    }
  }, [session]); // Remove 'loading' da lista de dependências.

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

  const handleDeleteProduct = async (produtoId: number) => {
    if (window.confirm("Você tem certeza que quer excluir este produto?")) {
      try {
        const { error } = await supabase.from('produtos').delete().eq('id', produtoId);
        if (error) throw error;
        alert("Produto excluído com sucesso!");
        getDadosDaLoja(); 
      } catch (error: any) {
        alert(`Erro ao excluir produto: ${error.message}`);
      }
    }
  };

  const handleOpenEditModal = (produto: Produto) => {
    setEditingProduct(produto);
    setIsModalOpen(true);
  };

  const handleUpdateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ 
          nome: editingProduct.nome,
          descricao: editingProduct.descricao,
          preco: editingProduct.preco,
        })
        .eq('id', editingProduct.id);
      if (error) throw error;
      alert("Produto atualizado com sucesso!");
      setIsModalOpen(false);
      setEditingProduct(null);
      getDadosDaLoja();
    } catch (error: any) {
      alert(`Erro ao atualizar produto: ${error.message}`);
    }
  };

  const handleUpdateOrderStatus = async (pedidoId: number, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId);

      if (error) {
        if (error.message.includes('permission denied')) {
            alert("Erro de permissão! Verifique se a política de segurança (RLS) para atualizar pedidos foi criada no Supabase.");
        }
        throw error;
      }
      alert(`Status do pedido atualizado para "${novoStatus}"!`);
      getDadosDaLoja();
    } catch (error: any) {
      alert(`Erro ao atualizar o status do pedido: ${error.message}`);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Painel da Loja: {loja?.nome_loja || 'Carregando...'}</h1>
        <p className="text-gray-400">Logado como: {session.user.email}</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Últimos Pedidos</h2>
        {loading ? <p>Carregando...</p> : (
            <div className="space-y-4">
              {pedidos.length > 0 ? pedidos.map(pedido => (
                  <div key={pedido.id} className="border-b border-gray-700 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                      <p className="text-sm text-gray-400">Pedido de {new Date(pedido.created_at).toLocaleDateString('pt-BR')} - <span className="font-bold text-lg text-green-400">R$ {pedido.total.toFixed(2)}</span></p>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <label htmlFor={`status-${pedido.id}`} className="text-sm">Status:</label>
                        <select id={`status-${pedido.id}`} value={pedido.status} onChange={(e) => handleUpdateOrderStatus(pedido.id, e.target.value)} className="bg-gray-700 text-white rounded p-1 text-sm">
                          <option value="pago">Pago</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregue">Entregue</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                    <ul className="list-disc list-inside mt-2 pl-2">
                      {pedido.produtos.map((p, index) => <li key={index} className="text-sm">{p.quantidade}x {p.nome}</li>)}
                    </ul>
                  </div>
              )) : <p>Nenhum pedido recebido ainda.</p>}
            </div>
        )}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Gerenciar Produtos</h2>
        <form onSubmit={handleAddProduto} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
            <input type="text" placeholder="Nome" value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md md:col-span-2" required/>
            <input type="number" step="0.01" placeholder="Preço" value={precoProduto} onChange={e => setPrecoProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md" required/>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 p-2 rounded-md font-bold h-full">Adicionar Produto</button>
            <textarea placeholder="Descrição" value={descricaoProduto} onChange={e => setDescricaoProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md md:col-span-4" />
        </form>
        <h3 className="text-xl font-bold mb-4 border-t border-gray-700 pt-4">Seus Produtos Cadastrados</h3>
        <div className="space-y-2">
            {produtos.length > 0 ? produtos.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                    <div>
                        <p className="font-bold">{p.nome}</p>
                        <p className="text-sm text-gray-400">R$ {p.preco.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleOpenEditModal(p)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">Editar</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-400 p-1" aria-label={`Excluir ${p.nome}`}>
                            <TrashIcon />
                        </button>
                    </div>
                </div>
            )) : <p className="text-gray-400">Nenhum produto cadastrado.</p>}
        </div>
      </div>

      <button onClick={() => supabase.auth.signOut()} className="mt-4 bg-red-600 hover:bg-red-700 p-2 rounded-md font-bold">
        Sair
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {editingProduct && (
          <form onSubmit={handleUpdateProduct}>
            <h2 className="text-2xl font-bold mb-4">Editar Produto</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-nome" className="block text-sm font-medium text-gray-300">Nome do Produto</label>
                <input id="edit-nome" type="text" value={editingProduct.nome} onChange={e => setEditingProduct({ ...editingProduct, nome: e.target.value })} className="w-full mt-1 bg-gray-700 p-2 rounded-md" required />
              </div>
              <div>
                <label htmlFor="edit-desc" className="block text-sm font-medium text-gray-300">Descrição</label>
                <textarea id="edit-desc" value={editingProduct.descricao} onChange={e => setEditingProduct({ ...editingProduct, descricao: e.target.value })} className="w-full mt-1 bg-gray-700 p-2 rounded-md h-24" />
              </div>
              <div>
                <label htmlFor="edit-preco" className="block text-sm font-medium text-gray-300">Preço</label>
                <input id="edit-preco" type="number" step="0.01" value={editingProduct.preco} onChange={e => setEditingProduct({ ...editingProduct, preco: parseFloat(e.target.value) || 0 })} className="w-full mt-1 bg-gray-700 p-2 rounded-md" required />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded">Cancelar</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 py-2 px-4 rounded">Salvar Alterações</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}