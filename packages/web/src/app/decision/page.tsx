'use client';

import { DecisionPanel } from '@/components/decision/decision-panel';
import { zh } from '@/messages/zh';

export default function DecisionPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.decision.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.decision.description}</p>
      </div>
      <DecisionPanel />
    </div>
  );
}
