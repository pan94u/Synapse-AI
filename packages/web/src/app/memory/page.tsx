'use client';

import { MemoryPanel } from '@/components/memory/memory-panel';
import { zh } from '@/messages/zh';

export default function MemoryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.memory.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.memory.description}</p>
      </div>
      <MemoryPanel />
    </div>
  );
}
