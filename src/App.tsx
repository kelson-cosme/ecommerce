// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { useStore } from './lib/StoreContext';

// Importando as páginas que criamos
import AdminPage from './pages/AdminPage';
import StorefrontPage from './pages/StorefrontPage';

function App() {
  const { loja, loading } = useStore(); // Pega a loja e o status do contexto

  // 1. Mostra uma tela de carregamento enquanto busca a loja pelo domínio
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">
        Carregando Plataforma...
      </div>
    );
  }

  // 2. Mostra um erro se nenhuma loja for encontrada para o domínio acessado
  if (!loja) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xl">
        <h1>Erro: Domínio não configurado na plataforma.</h1>
      </div>
    );
  }

  // 3. Se a loja foi encontrada, renderiza as rotas disponíveis
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        {/* Rota da Vitrine Pública */}
        <Route path="/" element={<StorefrontPage />} />

        {/* Rota do Painel do Lojista */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;