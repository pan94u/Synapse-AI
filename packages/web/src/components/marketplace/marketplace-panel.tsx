'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketplaceStats } from './marketplace-stats';
import { SkillBrowser } from './skill-browser';
import { InstalledList } from './installed-list';
import { SubmissionGuide } from './submission-guide';
import { ReviewQueue } from './review-queue';
import { zh } from '@/messages/zh';

export function MarketplacePanel() {
  return (
    <div className="space-y-4">
      <MarketplaceStats />
      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">{zh.marketplace.tabs.browse}</TabsTrigger>
          <TabsTrigger value="installed">{zh.marketplace.tabs.installed}</TabsTrigger>
          <TabsTrigger value="review">{zh.marketplace.tabs.reviewQueue}</TabsTrigger>
          <TabsTrigger value="guide">{zh.marketplace.guide.tabLabel}</TabsTrigger>
        </TabsList>
        <TabsContent value="browse">
          <SkillBrowser />
        </TabsContent>
        <TabsContent value="installed">
          <InstalledList />
        </TabsContent>
        <TabsContent value="review">
          <ReviewQueue />
        </TabsContent>
        <TabsContent value="guide">
          <SubmissionGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}
