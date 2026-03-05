'use client';

import type { PersonaConfig } from '@synapse/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonaTools } from './persona-tools';
import { zh } from '@/messages/zh';

interface PersonaCardProps {
  persona: PersonaConfig;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const toneLabel = zh.persona.toneLabels[persona.personality.tone];
  const focusLabel = zh.persona.focusLabels[persona.personality.focus];
  const cautionLabel = zh.persona.cautionLabels[persona.personality.caution];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{persona.name}</CardTitle>
        <CardDescription className="text-sm">{persona.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* Personality badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {zh.persona.personality.tone}: {toneLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {zh.persona.personality.focus}: {focusLabel}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {zh.persona.personality.caution}: {cautionLabel}
          </Badge>
        </div>

        {/* Tools */}
        <PersonaTools personaId={persona.id} />
      </CardContent>
    </Card>
  );
}
