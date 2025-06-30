// Caminho do arquivo: src/components/Header.tsx

import { Link } from 'react-router-dom';
import { useCart } from '../lib/CartContext';
import { useStore } from '../lib/StoreContext';

// Um ícone simples de carrinho de compras em SVG
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

export default function Header() {
  const { loja } = useStore();
  const { totalItems } = useCart();

  return (
    <header className="p-4 md:p-6 bg-gray-800 shadow-md">
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
        {/* Nome da Loja (link para a página inicial) */}
        <Link to="/" className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {loja?.nome_loja}
        </Link>

        {/* Ícone do Carrinho (link para a futura página do carrinho) */}
        <Link to="/carrinho" className="relative text-white hover:text-purple-300 transition-colors">
          <CartIcon />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}