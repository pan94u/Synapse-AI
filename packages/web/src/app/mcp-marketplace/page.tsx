'use client';

import { McpMarketplacePanel } from '@/components/mcp-marketplace/mcp-marketplace-panel';
import { zh } from '@/messages/zh';

export default function McpMarketplacePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.mcpMarketplace.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.mcpMarketplace.description}</p>
      </div>
      <McpMarketplacePanel />
    </div>
  );
}
