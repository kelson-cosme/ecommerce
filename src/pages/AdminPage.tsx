// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface Loja {
  id: number;
  nome_loja: string;
}

export default function HomePage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getLojas() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('lojas')
          .select('id, nome_loja');

        if (error) throw error;
        if (data) setLojas(data);

      } catch (error: any) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    }
    getLojas();
  }, []);

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">Lojas Disponíveis</h1>

      {loading ? (
        <p className="text-center text-white">Carregando lojas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lojas.map((loja) => (
            <Link 
              key={loja.id} 
              to={`/loja/${loja.id}`} 
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-purple-700 hover:scale-105 transition-transform duration-200"
            >
              <h2 className="text-2xl font-bold text-white text-center">{loja.nome_loja}</h2>
            </Link>
          ))}
        </div>
      )}
       {lojas.length === 0 && !loading && <p className="text-center text-white">Nenhuma loja cadastrada ainda.</p>}
    </div>
  );
}