'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalMemory } from './personal-memory';
import { OrgMemory } from './org-memory';
import { KnowledgeBase } from './knowledge-base';
import { zh } from '@/messages/zh';

export function MemoryPanel() {
  return (
    <Tabs defaultValue="personal">
      <TabsList>
        <TabsTrigger value="personal">{zh.memory.tabs.personal}</TabsTrigger>
        <TabsTrigger value="org">{zh.memory.tabs.org}</TabsTrigger>
        <TabsTrigger value="knowledge">{zh.memory.tabs.knowledge}</TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <PersonalMemory />
      </TabsContent>
      <TabsContent value="org">
        <OrgMemory />
      </TabsContent>
      <TabsContent value="knowledge">
        <KnowledgeBase />
      </TabsContent>
    </Tabs>
  );
}
