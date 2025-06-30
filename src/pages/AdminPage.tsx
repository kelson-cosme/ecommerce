// src/pages/AdminPage.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Auth from '../components/Auth';
import Dashboard from '../components/Dashboard';

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se já existe uma sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuta por mudanças no estado de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando sessão...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Se não há sessão, mostra o componente de autenticação. Se há, mostra o Dashboard. */}
      {!session ? <Auth /> : <Dashboard session={session} />}
    </div>
  );
}