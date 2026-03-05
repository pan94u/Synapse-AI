'use client';

import { ProactivePanel } from '@/components/proactive/proactive-panel';
import { zh } from '@/messages/zh';

export default function ProactivePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.proactive.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.proactive.description}</p>
      </div>
      <ProactivePanel />
    </div>
  );
}
