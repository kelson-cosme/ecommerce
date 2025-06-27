// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { useStore } from './lib/StoreContext';

import AdminPage from './pages/AdminPage'; // Página de Admin do Lojista
import StorefrontPage from './pages//StorefrontPage'; // Vitrine da Loja

function App() {
  const { loja, loading } = useStore();

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-2xl">Carregando Plataforma...</div>
  }

  if (!loja) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-2xl">Erro: Domínio não configurado.</div>
  }

  // Se a loja existe, renderiza as rotas dela
  return (
    <Routes>
      <Route path="/" element={<StorefrontPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;