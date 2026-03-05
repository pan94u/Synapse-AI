'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchedulerStatus } from './scheduler-status';
import { ActionList } from './action-list';
import { NotificationList } from './notification-list';
import { ExecutionHistory } from './execution-history';
import { zh } from '@/messages/zh';

export function ProactivePanel() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">{zh.proactive.tabs.overview}</TabsTrigger>
        <TabsTrigger value="actions">{zh.proactive.tabs.actions}</TabsTrigger>
        <TabsTrigger value="notifications">{zh.proactive.tabs.notifications}</TabsTrigger>
        <TabsTrigger value="history">{zh.proactive.tabs.history}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <SchedulerStatus />
      </TabsContent>
      <TabsContent value="actions">
        <ActionList />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationList />
      </TabsContent>
      <TabsContent value="history">
        <ExecutionHistory />
      </TabsContent>
    </Tabs>
  );
}
