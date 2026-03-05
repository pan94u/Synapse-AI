'use client';

import { PersonaList } from '@/components/personas/persona-list';
import { zh } from '@/messages/zh';

export default function PersonasPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.persona.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.persona.description}</p>
      </div>
      <PersonaList />
    </div>
  );
}
