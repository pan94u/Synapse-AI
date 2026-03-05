'use client';

import { Wrench } from 'lucide-react';
import { usePersonaTools } from '@/hooks/use-persona-tools';
import { Skeleton } from '@/components/ui/skeleton';
import { zh } from '@/messages/zh';

interface PersonaToolsProps {
  personaId: string;
}

export function PersonaTools({ personaId }: PersonaToolsProps) {
  const { tools, loading } = usePersonaTools(personaId);

  if (loading) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (tools.length === 0) {
    return <p className="text-xs text-muted-foreground">{zh.persona.noTools}</p>;
  }

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-medium text-muted-foreground">{zh.persona.tools} ({tools.length})</h4>
      <div className="flex flex-wrap gap-1.5">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
            title={tool.description}
          >
            <Wrench className="h-3 w-3" />
            <span>{tool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
