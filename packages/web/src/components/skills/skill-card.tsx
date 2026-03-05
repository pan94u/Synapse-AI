'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { zh } from '@/messages/zh';
import type { Skill } from './skill-list';

interface SkillCardProps {
  skill: Skill;
  onToggle: (id: string, enabled: boolean) => void;
  onClick: () => void;
}

export function SkillCard({ skill, onToggle, onClick }: SkillCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{skill.name}</CardTitle>
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Switch
              checked={skill.status === 'active'}
              onCheckedChange={(checked) => onToggle(skill.id, checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{skill.description}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{skill.category}</Badge>
          <Badge variant={skill.status === 'active' ? 'default' : 'secondary'}>
            {skill.status === 'active' ? zh.skills.card.enabled : zh.skills.card.disabled}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
