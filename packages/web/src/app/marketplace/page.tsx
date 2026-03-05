'use client';

import { MarketplacePanel } from '@/components/marketplace/marketplace-panel';
import { zh } from '@/messages/zh';

export default function MarketplacePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.marketplace.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.marketplace.description}</p>
      </div>
      <MarketplacePanel />
    </div>
  );
}
