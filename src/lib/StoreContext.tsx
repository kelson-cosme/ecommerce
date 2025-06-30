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

const StoreContext = createContext<StoreContextType>({ loja: null, loading: true });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStore() {
      const domain = window.location.hostname;
      
      // IMPORTANTE: Para testar localmente, troque 'lojateste.com' 
      // pelo domínio exato que você cadastrou na sua tabela 'lojas' no Supabase.
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

export function useStore() {
  return useContext(StoreContext);
}