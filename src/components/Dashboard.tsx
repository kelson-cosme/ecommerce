

// Caminho do arquivo: src/components/Dashboard.tsx

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Modal from './Modal';

// --- Interfaces ---
interface Loja { id: number; nome_loja: string; }
interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem_principal_url?: string;
}
interface ImagemProduto { id: number; imagem_url: string; is_principal: boolean; }
interface Pedido {
  id: number;
  created_at: string;
  status: string;
  total: number;
  produtos: { nome: string; preco: number; quantidade: number }[];
}
interface VarianteForm {
  id: number;
  nome: string;
  opcoes: string;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const sanitizarNomeArquivo = (nome: string) => {
  const nomeSemAcentos = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return nomeSemAcentos.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export default function Dashboard({ session }: { session: Session }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nomeProduto, setNomeProduto] = useState('');
  const [descricaoProduto, setDescricaoProduto] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');
  const [imagensArquivos, setImagensArquivos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [variantes, setVariantes] = useState<VarianteForm[]>([{ id: Date.now(), nome: '', opcoes: '' }]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [imagensDoProdutoEditado, setImagensDoProdutoEditado] = useState<ImagemProduto[]>([]);

  const getDadosDaLoja = useCallback(async () => {
    try {
      setLoading(true);
      const { user } = session;
      const { data: lojaData, error: lojaError } = await supabase.from('lojas').select(`id, nome_loja`).eq('user_id', user.id).single();
      if (lojaError) throw lojaError;
      if (lojaData) {
        setLoja(lojaData);
        const [produtosResponse, pedidosResponse] = await Promise.all([
          supabase.from('produtos_com_imagem_principal').select('*').eq('loja_id', lojaData.id).order('created_at', { ascending: false }),
          supabase.from('pedidos').select('*').eq('loja_id', lojaData.id).order('created_at', { ascending: false })
        ]);
        if (produtosResponse.error) throw produtosResponse.error;
        setProdutos(produtosResponse.data as Produto[] || []);
        if (pedidosResponse.error) throw pedidosResponse.error;
        setPedidos(pedidosResponse.data || []);
      }
    } catch (error: any) { alert(error.message); } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { getDadosDaLoja(); }, [getDadosDaLoja]);
  
  const handleAddProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loja) return;
    try {
      setUploading(true);
      const { data: produtoData, error: insertError } = await supabase.from('produtos').insert({ nome: nomeProduto, descricao: descricaoProduto, preco: parseFloat(precoProduto), loja_id: loja.id }).select().single();
      if (insertError) throw insertError;
      if (!produtoData) throw new Error("Não foi possível criar o produto.");
      const produtoId = produtoData.id;

      for (const variante of variantes) {
        if (variante.nome && variante.opcoes) {
          let { data: tipoExistente } = await supabase.from('tipos_variante').select('id').eq('loja_id', loja.id).eq('nome', variante.nome).single();
          let tipoId;
          if (tipoExistente) {
            tipoId = tipoExistente.id;
          } else {
            const { data: novoTipo, error: tipoError } = await supabase.from('tipos_variante').insert({ loja_id: loja.id, nome: variante.nome }).select().single();
            if (tipoError) throw tipoError;
            tipoId = novoTipo!.id;
          }
          const opcoesArray = variante.opcoes.split(',').map(opt => opt.trim()).filter(opt => opt);
          const opcoesParaInserir = opcoesArray.map(opt => ({ produto_id: produtoId, tipo_id: tipoId, valor: opt }));
          const { error: opcoesError } = await supabase.from('opcoes_variante').insert(opcoesParaInserir);
          if (opcoesError) throw opcoesError;
        }
      }

      if (imagensArquivos.length > 0) {
        for (const [index, arquivo] of imagensArquivos.entries()) {
          const nomeArquivoLimpo = sanitizarNomeArquivo(arquivo.name);
          const filePath = `${loja.id}/${produtoId}/${Date.now()}_${nomeArquivoLimpo}`;
          const { error: uploadError } = await supabase.storage.from('imagens-produtos').upload(filePath, arquivo, { cacheControl: '3600' });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('imagens-produtos').getPublicUrl(filePath);
          await supabase.from('produto_imagens').insert({ produto_id: produtoId, imagem_url: urlData.publicUrl, is_principal: index === 0 });
        }
      }
      
      alert('Produto adicionado com sucesso!');
      setNomeProduto(''); setDescricaoProduto(''); setPrecoProduto(''); setImagensArquivos([]); setVariantes([{ id: Date.now(), nome: '', opcoes: '' }]);
      (e.target as HTMLFormElement).reset();
      getDadosDaLoja();
    } catch (error: any) { alert(error.message); } finally { setUploading(false); }
  };

  const handleDeleteProduct = async (produtoId: number) => {
    if (window.confirm("Você tem certeza que quer excluir este produto?")) {
      try {
        await supabase.from('produtos').delete().eq('id', produtoId);
        getDadosDaLoja();
      } catch (error: any) { alert(error.message); }
    }
  };

  const handleOpenEditModal = async (produto: Produto) => {
    setEditingProduct(produto);
    const { data } = await supabase.from('produto_imagens').select('*').eq('produto_id', produto.id);
    setImagensDoProdutoEditado(data || []);
    setIsModalOpen(true);
  };

  const handleUpdateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    try {
      await supabase.from('produtos').update({ nome: editingProduct.nome, descricao: editingProduct.descricao, preco: editingProduct.preco }).eq('id', editingProduct.id);
      alert("Produto atualizado!");
      setIsModalOpen(false);
      setEditingProduct(null);
      getDadosDaLoja();
    } catch (error: any) { alert(error.message); }
  };

  const handleUpdateOrderStatus = async (pedidoId: number, novoStatus: string) => {
    try {
      await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId);
      getDadosDaLoja();
    } catch (error: any) { alert(error.message); }
  };

  const handleImagemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > 5) { alert("Máximo de 5 imagens."); e.target.value = ''; return; }
      setImagensArquivos(Array.from(e.target.files));
    }
  };

  const handleVarianteChange = (index: number, field: 'nome' | 'opcoes', value: string) => {
    const novasVariantes = [...variantes];
    novasVariantes[index][field] = value;
    setVariantes(novasVariantes);
  };

  const adicionarCampoVariante = () => setVariantes([...variantes, { id: Date.now(), nome: '', opcoes: '' }]);
  const removerCampoVariante = (id: number) => setVariantes(variantes.filter(v => v.id !== id));

  const handleSetPrincipalImage = async (produtoId: number, imagemId: number) => {
    try {
      await supabase.from('produto_imagens').update({ is_principal: false }).eq('produto_id', produtoId);
      await supabase.from('produto_imagens').update({ is_principal: true }).eq('id', imagemId);
      setImagensDoProdutoEditado(prev => prev.map(img => ({ ...img, is_principal: img.id === imagemId })));
      getDadosDaLoja();
    } catch (error: any) { alert(error.message); }
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
        <form onSubmit={handleAddProduto} className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Nome do Produto" value={nomeProduto} onChange={e => setNomeProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md md:col-span-2" required/>
            <input type="number" step="0.01" placeholder="Preço Base" value={precoProduto} onChange={e => setPrecoProduto(e.target.value)} className="bg-gray-700 p-2 rounded-md" required/>
          </div>
          <textarea placeholder="Descrição" value={descricaoProduto} onChange={e => setDescricaoProduto(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md h-24" />
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold">Variantes do Produto</h3>
            {variantes.map((variante, index) => (
              <div key={variante.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                <input type="text" placeholder='Tipo (ex: Tamanho)' value={variante.nome} onChange={(e) => handleVarianteChange(index, 'nome', e.target.value)} className="bg-gray-700 p-2 rounded-md md:col-span-2"/>
                <input type="text" placeholder='Opções (P, M, G, GG)' value={variante.opcoes} onChange={(e) => handleVarianteChange(index, 'opcoes', e.target.value)} className="bg-gray-700 p-2 rounded-md md:col-span-2"/>
                <button type="button" onClick={() => removerCampoVariante(variante.id)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-md h-full">Remover</button>
              </div>
            ))}
            <button type="button" onClick={adicionarCampoVariante} className="text-purple-400 hover:text-purple-300 text-sm font-semibold">+ Adicionar variante</button>
          </div>
          <div>
            <label htmlFor="imagem" className="block text-sm font-medium text-gray-400 mb-1">Imagens (até 5)</label>
            <input id="imagem" type="file" accept="image/*" multiple onChange={handleImagemChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
          </div>
          <div className="text-right">
            <button type="submit" disabled={uploading} className="bg-purple-600 hover:bg-purple-700 p-3 rounded-md font-bold disabled:bg-gray-500">{uploading ? 'Enviando...' : 'Adicionar Produto'}</button>
          </div>
        </form>
        <h3 className="text-xl font-bold mb-4 border-t border-gray-700 pt-4">Seus Produtos</h3>
        <div className="space-y-2">
            {produtos.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-600 rounded-md flex-shrink-0">{p.imagem_principal_url && <img src={`${p.imagem_principal_url}?format=webp&resize=smart&quality=75&width=100`} alt={p.nome} className="w-full h-full object-cover rounded-md"/>}</div><div><p className="font-bold">{p.nome}</p><p className="text-sm text-gray-400">R$ {p.preco.toFixed(2)}</p></div></div>
                    <div className="flex items-center gap-3"><button onClick={() => handleOpenEditModal(p)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">Editar</button><button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-400 p-1"><TrashIcon /></button></div>
                </div>
            ))}
        </div>
      </div>
      <button onClick={() => supabase.auth.signOut()} className="mt-4 bg-red-600 hover:bg-red-700 p-2 rounded-md font-bold">Sair</button>
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
             </div>            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-300">Gerenciar Imagens</h3>
              {imagensDoProdutoEditado.length > 0 ? (
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {imagensDoProdutoEditado.map(img => (
                    <div key={img.id} className="relative group aspect-square">
                      <img src={`${img.imagem_url}?format=webp&resize=smart&quality=75&width=200`} alt="Produto" className="rounded-md w-full h-full object-cover" />
                      {img.is_principal ? (<div className="absolute inset-0 bg-green-900 bg-opacity-70 flex items-center justify-center rounded-md"><span className="text-white text-xs font-bold text-center">Principal</span></div>) : (<button type="button" onClick={() => handleSetPrincipalImage(editingProduct.id, img.id)} className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md text-sm p-1 text-center">Tornar Principal</button>)}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 mt-2">Nenhuma imagem.</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded">Fechar</button><button type="submit" className="bg-blue-600 hover:bg-blue-500 py-2 px-4 rounded">Salvar</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}