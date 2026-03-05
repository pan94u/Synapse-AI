'use client';

import { SettingsPanel } from '@/components/settings/settings-panel';
import { zh } from '@/messages/zh';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{zh.settings.title}</h1>
        <p className="mt-1 text-muted-foreground">{zh.settings.description}</p>
      </div>
      <SettingsPanel />
    </div>
  );
}
