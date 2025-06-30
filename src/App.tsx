// Caminho do arquivo: src/App.tsx

import { Routes, Route } from 'react-router-dom';
import { useStore } from './lib/StoreContext';
import Header from './components/Header';
import AdminPage from './pages/AdminPage';
import StorefrontPage from './pages/StorefrontPage';
import CartPage from './pages/CartPage'; // <-- 1. IMPORTE A NOVA PÁGINA

function App() {
  const { loja, loading } = useStore();

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">Carregando Plataforma...</div>
  }
  if (!loja) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl"><h1>Erro: Domínio não configurado.</h1></div>
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <Routes>
        <Route path="/" element={<StorefrontPage />} />
        <Route path="/admin" element={<AdminPage />} />
        {/* 2. ATUALIZE A ROTA DO CARRINHO */}
        <Route path="/carrinho" element={<CartPage />} /> 
      </Routes>
    </div>
  );
}

export default App;