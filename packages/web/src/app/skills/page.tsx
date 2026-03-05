'use client';

import { SkillPanel } from '@/components/skills/skill-panel';
import { zh } from '@/messages/zh';

export default function SkillsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.skills.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.skills.description}</p>
      </div>
      <SkillPanel />
    </div>
  );
}
