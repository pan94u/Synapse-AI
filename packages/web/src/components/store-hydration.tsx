'use client';

import { useEffect } from 'react';
import { usePersonaStore } from '@/stores/persona-store';

export function StoreHydration() {
  useEffect(() => {
    usePersonaStore.persist.rehydrate();
  }, []);

  return null;
}
