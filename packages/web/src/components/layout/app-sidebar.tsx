'use client';

import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarNav } from './sidebar-nav';
import { PersonaSwitcher } from './persona-switcher';
import { useUIStore } from '@/stores/ui-store';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '@/lib/constants';
import { zh } from '@/messages/zh';

export function AppSidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, setMobileSidebarOpen } =
    useUIStore();

  const sidebarContent = (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn('flex h-14 items-center border-b px-4', sidebarCollapsed && 'justify-center px-2')}>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold">{zh.app.name}</span>
          )}
          {sidebarCollapsed && (
            <span className="text-lg font-bold">S</span>
          )}
        </div>

        {/* Persona Switcher */}
        <div className="p-2">
          <PersonaSwitcher collapsed={sidebarCollapsed} />
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-2">
          <SidebarNav collapsed={sidebarCollapsed} />
        </div>

        <Separator />

        {/* Collapse toggle */}
        <div className="p-2">
          <Button
            variant="ghost"
            size={sidebarCollapsed ? 'icon' : 'default'}
            onClick={toggleSidebar}
            className={cn('w-full', !sidebarCollapsed && 'justify-start gap-3')}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>{zh.sidebar.collapse}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col md:border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200"
        style={{ width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetTitle className="sr-only">{zh.sidebar.expand}</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
