'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RuleList } from './rule-list';
import { AuditTrail } from './audit-trail';
import { ApprovalList } from './approval-list';
import { zh } from '@/messages/zh';

export function CompliancePanel() {
  return (
    <Tabs defaultValue="rules">
      <TabsList>
        <TabsTrigger value="rules">{zh.compliance.tabs.rules}</TabsTrigger>
        <TabsTrigger value="audit">{zh.compliance.tabs.audit}</TabsTrigger>
        <TabsTrigger value="approvals">{zh.compliance.tabs.approvals}</TabsTrigger>
      </TabsList>
      <TabsContent value="rules">
        <RuleList />
      </TabsContent>
      <TabsContent value="audit">
        <AuditTrail />
      </TabsContent>
      <TabsContent value="approvals">
        <ApprovalList />
      </TabsContent>
    </Tabs>
  );
}
