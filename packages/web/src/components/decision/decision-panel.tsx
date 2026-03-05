'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricsView } from './metrics-view';
import { InsightsView } from './insights-view';
import { StrategyView } from './strategy-view';
import { JournalView } from './journal-view';
import { ReportsView } from './reports-view';
import { zh } from '@/messages/zh';

export function DecisionPanel() {
  return (
    <Tabs defaultValue="metrics">
      <TabsList>
        <TabsTrigger value="metrics">{zh.decision.tabs.metrics}</TabsTrigger>
        <TabsTrigger value="insights">{zh.decision.tabs.insights}</TabsTrigger>
        <TabsTrigger value="strategy">{zh.decision.tabs.strategy}</TabsTrigger>
        <TabsTrigger value="journal">{zh.decision.tabs.journal}</TabsTrigger>
        <TabsTrigger value="reports">{zh.decision.tabs.reports}</TabsTrigger>
      </TabsList>
      <TabsContent value="metrics">
        <MetricsView />
      </TabsContent>
      <TabsContent value="insights">
        <InsightsView />
      </TabsContent>
      <TabsContent value="strategy">
        <StrategyView />
      </TabsContent>
      <TabsContent value="journal">
        <JournalView />
      </TabsContent>
      <TabsContent value="reports">
        <ReportsView />
      </TabsContent>
    </Tabs>
  );
}
