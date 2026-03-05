'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { zh } from '@/messages/zh';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function getLabel(key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = zh;
  for (const p of parts) {
    obj = obj?.[p];
  }
  return typeof obj === 'string' ? obj : key;
}

interface SidebarNavProps {
  collapsed: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const label = getLabel(item.label);
        const Icon = item.icon;

        const linkContent = (
          <Link
            href={item.disabled ? '#' : item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
              item.disabled && 'pointer-events-none opacity-40',
              collapsed && 'justify-center px-2'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.id}>{linkContent}</div>;
      })}
    </nav>
  );
}
