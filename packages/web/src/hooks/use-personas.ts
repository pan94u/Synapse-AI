'use client';

import { useEffect, useState } from 'react';
import type { PersonaConfig } from '@synapse/shared';
import { apiFetch } from '@/lib/api';
import { usePersonaStore } from '@/stores/persona-store';

interface PersonasResponse {
  personas: PersonaConfig[];
}

export function usePersonas() {
  const { personas, setPersonas } = usePersonaStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPersonas() {
      try {
        setLoading(true);
        const data = await apiFetch<PersonasResponse>('/personas');
        if (!cancelled) {
          setPersonas(data.personas);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch personas');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPersonas();
    return () => { cancelled = true; };
  }, [setPersonas]);

  return { personas, loading, error };
}
