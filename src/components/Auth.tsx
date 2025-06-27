// src/components/Auth.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeLoja, setNomeLoja] = useState(''); // <-- NOVO: Estado para o nome da loja

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.error_description || error.message);
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!nomeLoja) { // <-- NOVO: Validação simples
      alert('Por favor, digite o nome da sua loja.');
      return;
    }

    setLoading(true);
    // 1. Cadastra o usuário
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      alert(signUpError.message);
      setLoading(false);
      return;
    }

    if (user) {
      // 2. Se o usuário foi criado, insere a loja
      const { error: insertError } = await supabase
        .from('lojas')
        .insert({ nome_loja: nomeLoja, user_id: user.id });

      if (insertError) {
        alert('Erro ao criar a loja: ' + insertError.message);
      } else {
        alert('Usuário e loja cadastrados! Verifique seu email para confirmação.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
      <h1 className="text-2xl font-bold mb-4">Painel do Lojista</h1>
      <p className="mb-6 text-gray-400">Crie sua loja ou faça login.</p>
      
      <form onSubmit={handleLogin} className="w-full">
        <div className="flex flex-col gap-4">
          {/* NOVO: Campo para o nome da loja */}
          <input
            className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            type="text"
            placeholder="Nome da sua Loja"
            value={nomeLoja}
            onChange={(e) => setNomeLoja(e.target.value)}
          />
          <input
            className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            type="email"
            placeholder="Seu email"
            value={email}
            required={true}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            type="password"
            placeholder="Sua senha (mínimo 6 caracteres)"
            value={password}
            required={true}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-4 mt-6">
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg" disabled={loading}>
            {loading ? <span>Aguarde...</span> : <span>Login</span>}
          </button>
          <button type="button" onClick={handleSignup} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg" disabled={loading}>
            {loading ? <span>Aguarde...</span> : <span>Criar minha Loja</span>}
          </button>
        </div>
      </form>
    </div>
  );
}