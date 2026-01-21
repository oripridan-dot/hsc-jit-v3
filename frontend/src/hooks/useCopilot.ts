import { useState } from 'react';
import type { Product } from '../lib/catalogLoader'; // Importing from catalogLoader as it exports Product

export const useCopilot = () => {
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (query: string) => {
    setLoading(true);
    setAnswer(null);
    setSources([]);
    setError(null);
    
    try {
        // Call your Python RAG Backend
        // This connects the UI to the JIT RAG System running on :8000
        const res = await fetch('http://localhost:8000/api/v1/rag/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        
        if (!res.ok) {
            throw new Error(`Copilot unavailable (HTTP ${res.status})`);
        }
        
        const data = await res.json();
        // The backend returns semantic matches + AI insight
        setAnswer(data.insight); 
        setSources(data.products || []); 
    } catch (e) {
        console.warn("Copilot unreachable:", e);
        setError(e instanceof Error ? e.message : "Failed to connect to Copilot");
    } finally {
        setLoading(false);
    }
  };

  return { ask, answer, sources, loading, error };
};
