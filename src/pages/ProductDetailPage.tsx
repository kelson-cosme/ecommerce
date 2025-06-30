// Caminho do arquivo: src/pages/ProductDetailPage.tsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../lib/CartContext';

// --- Interfaces ---
interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  loja_id: number;
}

// Nova interface para as imagens
interface ImagemProduto {
  id: number;
  imagem_url: string;
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { addToCart } = useCart();
  const [produto, setProduto] = useState<Produto | null>(null);
  // ---- NOVOS ESTADOS PARA A GALERIA ----
  const [imagens, setImagens] = useState<ImagemProduto[]>([]);
  const [imagemPrincipal, setImagemPrincipal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDadosDoProduto() {
      if (!productId) return;
      try {
        setLoading(true);

        // Busca os dados do produto e as imagens em paralelo
        const [produtoResponse, imagensResponse] = await Promise.all([
          supabase.from('produtos').select('*').eq('id', productId).single(),
          supabase.from('produto_imagens').select('*').eq('produto_id', productId)
        ]);

        if (produtoResponse.error) throw produtoResponse.error;
        setProduto(produtoResponse.data);

        if (imagensResponse.error) throw imagensResponse.error;
        if (imagensResponse.data) {
          setImagens(imagensResponse.data);
          // Define a primeira imagem da lista como a principal
          if (imagensResponse.data.length > 0) {
            setImagemPrincipal(imagensResponse.data[0].imagem_url);
          }
        }

      } catch (error: any) {
        console.error("Erro ao buscar detalhes do produto:", error);
      } finally {
        setLoading(false);
      }
    }
    getDadosDoProduto();
  }, [productId]);

  if (loading) {
    return <p className="text-center text-white text-2xl p-10">Carregando produto...</p>;
  }

  if (!produto) {
    return <p className="text-center text-white text-2xl p-10">Produto não encontrado.</p>;
  }

  const handleAddToCart = () => {
    addToCart(produto);
    alert(`${produto.nome} foi adicionado ao carrinho!`);
  };

  return (
    <main className="p-4 md:p-8 w-full max-w-5xl mx-auto">
      <Link to="/" className="text-purple-400 hover:underline mb-8 block">&larr; Voltar para a loja</Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        
        {/* ---- LADO DA GALERIA DE IMAGENS (ATUALIZADO) ---- */}
        <div className="flex flex-col gap-4">
          {/* Imagem Principal */}
          <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
            {imagemPrincipal ? (
              <img src={`${imagemPrincipal}?format=webp&resize=smart&quality=80`} alt={produto.nome} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-500">Sem Imagem</span>
            )}
          </div>
          {/* Miniaturas (Thumbnails) */}
          {imagens.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {imagens.map(img => (
                <button
                  key={img.id}
                  onClick={() => setImagemPrincipal(img.imagem_url)}
                  className={`aspect-square bg-gray-800 rounded-md overflow-hidden border-2 ${imagemPrincipal === img.imagem_url ? 'border-purple-500' : 'border-transparent'}`}
                >
                  <img src={`${img.imagem_url}?format=webp&resize=smart&quality=75&width=150&height=150`} alt={`Thumbnail ${produto.nome}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Lado dos Detalhes (sem mudanças na lógica) */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold mb-4">{produto.nome}</h1>
          <p className="text-gray-300 text-lg mb-6 flex-grow">{produto.descricao || "Este produto não possui uma descrição detalhada."}</p>
          <div className="mt-auto">
            <p className="text-4xl font-bold text-green-400 mb-6">R$ {produto.preco.toFixed(2).replace('.', ',')}</p>
            <button
              onClick={handleAddToCart}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg text-lg"
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
      
      {/* Seção de Avaliações */}
      <div className="mt-12 pt-8 border-t border-gray-700">
        <h2 className="text-2xl font-bold">Avaliações</h2>
        <p className="text-gray-500 mt-4">Ainda não há avaliações para este produto.</p>
      </div>
    </main>
  );
}