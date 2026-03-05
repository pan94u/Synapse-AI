'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { zh } from '@/messages/zh';

export function Header() {
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <header className="flex h-14 items-center gap-4 border-b px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">菜单</span>
      </Button>
      <h1 className="text-lg font-semibold">{zh.app.name}</h1>
    </header>
  );
}
