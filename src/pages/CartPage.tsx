// Caminho do arquivo: src/pages/CartPage.tsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../lib/CartContext';
import { useStore } from '../lib/StoreContext';
import { supabase } from '../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

// Carrega a instância do Stripe com a chave publicável do .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Componente do Ícone de Lixeira
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);


export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { loja } = useStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Calcula o subtotal com base nos itens do carrinho
  const subtotal = cartItems.reduce((total, item) => total + item.preco * item.quantity, 0);

  // Função para finalizar a compra com todos os itens do carrinho
  const handleCheckout = async () => {
    if (!loja) {
      alert("Erro: Informações da loja não encontradas. Tente recarregar a página.");
      return;
    }
    setIsCheckingOut(true);

    try {
      // Chama a Edge Function com o array completo de itens do carrinho
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          cartItems: cartItems,
          loja_id: loja.id,
          dominio: window.location.host,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const stripe = await stripePromise;
      if (stripe && data.sessionId) {
        // Redireciona o cliente para a página de pagamento segura do Stripe
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error("Não foi possível obter a sessão do Stripe.");
      }

    } catch (error: any) {
      console.error("Erro ao finalizar a compra:", error);
      alert(`Não foi possível iniciar o pagamento: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Renderiza a mensagem de carrinho vazio
  if (cartItems.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
        <Link to="/" className="text-purple-400 hover:underline">
          &larr; Voltar para a loja
        </Link>
      </div>
    );
  }

  // Renderiza a página do carrinho com os itens
  return (
    <main className="p-4 md:p-8 w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Seu Carrinho</h1>

      <div className="space-y-4">
        {cartItems.map(item => (
          <div key={item.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-4 flex-grow">
              <div className="w-16 h-16 bg-gray-700 rounded flex-shrink-0"></div>
              <div>
                <h2 className="font-bold text-lg">{item.nome}</h2>
                <p className="text-gray-400">R$ {item.preco.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                className="w-16 bg-gray-700 text-white text-center rounded p-1"
                aria-label={`Quantidade para ${item.nome}`}
              />
              <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1" aria-label={`Remover ${item.nome}`}>
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold">Subtotal</span>
          <span className="text-2xl font-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg text-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isCheckingOut ? 'Processando...' : 'Finalizar Compra'}
        </button>
        <button
          onClick={() => clearCart()}
          className="w-full mt-2 text-gray-400 hover:text-white text-sm"
        >
          Limpar Carrinho
        </button>
      </div>
    </main>
  );
}