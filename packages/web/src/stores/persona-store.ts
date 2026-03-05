import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersonaConfig } from '@synapse/shared';

interface PersonaState {
  personas: PersonaConfig[];
  activePersonaId: string | null;
  _hydrated: boolean;
  setPersonas: (personas: PersonaConfig[]) => void;
  setActivePersonaId: (id: string) => void;
  getActivePersona: () => PersonaConfig | undefined;
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set, get) => ({
      personas: [],
      activePersonaId: null,
      _hydrated: false,
      setPersonas: (personas) => set({ personas }),
      setActivePersonaId: (id) => set({ activePersonaId: id }),
      getActivePersona: () => {
        const { personas, activePersonaId } = get();
        return personas.find((p) => p.id === activePersonaId);
      },
    }),
    {
      name: 'synapse-persona',
      partialize: (state) => ({ activePersonaId: state.activePersonaId }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        usePersonaStore.setState({ _hydrated: true });
      },
    }
  )
);
