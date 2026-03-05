'use client';

import { McpPanel } from '@/components/mcp/mcp-panel';
import { zh } from '@/messages/zh';

export default function McpPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.mcp.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.mcp.description}</p>
      </div>
      <McpPanel />
    </div>
  );
}
