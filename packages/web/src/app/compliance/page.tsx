'use client';

import { CompliancePanel } from '@/components/compliance/compliance-panel';
import { zh } from '@/messages/zh';

export default function CompliancePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.compliance.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.compliance.description}</p>
      </div>
      <CompliancePanel />
    </div>
  );
}
