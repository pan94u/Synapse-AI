'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServerList } from './server-list';
import { ToolList } from './tool-list';
import { AuditLog } from './audit-log';
import { zh } from '@/messages/zh';

export function McpPanel() {
  return (
    <Tabs defaultValue="servers">
      <TabsList>
        <TabsTrigger value="servers">{zh.mcp.tabs.servers}</TabsTrigger>
        <TabsTrigger value="tools">{zh.mcp.tabs.tools}</TabsTrigger>
        <TabsTrigger value="audit">{zh.mcp.tabs.audit}</TabsTrigger>
      </TabsList>
      <TabsContent value="servers">
        <ServerList />
      </TabsContent>
      <TabsContent value="tools">
        <ToolList />
      </TabsContent>
      <TabsContent value="audit">
        <AuditLog />
      </TabsContent>
    </Tabs>
  );
}
