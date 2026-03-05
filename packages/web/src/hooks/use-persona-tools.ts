'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface PersonaTool {
  name: string;
  description: string;
}

interface PersonaToolsResponse {
  personaId: string;
  tools: PersonaTool[];
}

export function usePersonaTools(personaId: string) {
  const [tools, setTools] = useState<PersonaTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTools() {
      try {
        setLoading(true);
        const data = await apiFetch<PersonaToolsResponse>(`/personas/${personaId}/tools`);
        if (!cancelled) {
          setTools(data.tools);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch tools');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTools();
    return () => { cancelled = true; };
  }, [personaId]);

  return { tools, loading, error };
}
