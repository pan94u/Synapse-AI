'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillList } from './skill-list';
import { SkillHistory } from './skill-history';
import { zh } from '@/messages/zh';

export function SkillPanel() {
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">{zh.skills.tabs.all}</TabsTrigger>
        <TabsTrigger value="history">{zh.skills.tabs.history}</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <SkillList />
      </TabsContent>
      <TabsContent value="history">
        <SkillHistory />
      </TabsContent>
    </Tabs>
  );
}
