// Caminho do arquivo: src/lib/CartContext.tsx

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// --- Interfaces (Tipos de Dados) ---
interface Produto {
  id: number;
  nome: string;
  preco: number;
  // Adicionaremos a loja_id para garantir que o carrinho é específico para cada loja
  loja_id: number; 
}

interface CartItem extends Produto {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (produto: Produto) => void;
  removeFromCart: (produtoId: number) => void;
  updateQuantity: (produtoId: number, newQuantity: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// --- O Provedor do Contexto ---
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Carrega o carrinho do localStorage quando a aplicação inicia
  useEffect(() => {
    try {
      const localData = localStorage.getItem('shoppingCart');
      if (localData) {
        setCartItems(JSON.parse(localData));
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho do localStorage", error);
    }
  }, []);

  // Salva o carrinho no localStorage sempre que ele é alterado
  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (produto: Produto) => {
    setCartItems(prevItems => {
      // Se o produto já existe, apenas incrementa a quantidade
      const existingItem = prevItems.find(item => item.id === produto.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === produto.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Se for um novo produto, adiciona ao carrinho
      return [...prevItems, { ...produto, quantity: 1 }];
    });
  };

  const removeFromCart = (produtoId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== produtoId));
  };

  const updateQuantity = (produtoId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(produtoId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === produtoId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };
  
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// --- Hook Customizado para usar o contexto ---
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}