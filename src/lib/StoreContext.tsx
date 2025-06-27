// src/lib/StoreContext.tsx
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from './supabaseClient';

interface Loja {
  id: number;
  nome_loja: string;
  dominio: string;
}

interface StoreContextType {
  loja: Loja | null;
  loading: boolean;
}

// O valor inicial do contexto
const StoreContext = createContext<StoreContextType>({ loja: null, loading: true });

// O Provedor que vai envolver a aplicação
export function StoreProvider({ children }: { children: ReactNode }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStore() {
      // Pega o hostname (ex: "lojalegal.com.br", "localhost")
      const domain = window.location.hostname;

      // No ambiente de desenvolvimento, podemos simular um domínio para testes.
      // Troque 'lojateste.com' pelo domínio de uma loja que você cadastrou no Supabase para testar.
      const domainToFetch = domain === 'localhost' ? 'lojateste.com' : domain;

      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('dominio', domainToFetch)
        .single();

      if (data) {
        setLoja(data);
      } else {
        console.error("Nenhuma loja encontrada para este domínio:", domainToFetch, error);
      }
      setLoading(false);
    }

    fetchStore();
  }, []);

  const value = { loja, loading };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// Hook customizado para usar o contexto facilmente
export function useStore() {
  return useContext(StoreContext);
}