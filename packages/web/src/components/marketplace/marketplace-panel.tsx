'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MarketplaceStats } from './marketplace-stats';
import { SkillBrowser } from './skill-browser';
import { InstalledList } from './installed-list';
import { SubmissionGuide } from './submission-guide';
import { ReviewQueue } from './review-queue';
import { PublishWizard } from './publish-wizard';
import { zh } from '@/messages/zh';

export function MarketplacePanel() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="space-y-4">
      <MarketplaceStats />
      <div className="flex items-center justify-end">
        <Button onClick={() => setWizardOpen(true)}>
          {zh.marketplace.publish.button}
        </Button>
      </div>
      <PublishWizard open={wizardOpen} onOpenChange={setWizardOpen} />
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
