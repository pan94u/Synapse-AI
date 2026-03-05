'use client';

import { ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersonas } from '@/hooks/use-personas';
import { usePersonaStore } from '@/stores/persona-store';
import { zh } from '@/messages/zh';

const PERSONA_COLORS: Record<string, string> = {
  ceo: 'bg-red-500',
  hr: 'bg-blue-500',
  finance: 'bg-green-500',
  legal: 'bg-purple-500',
  sales: 'bg-orange-500',
  ops: 'bg-teal-500',
  engineer: 'bg-indigo-500',
};

function getPersonaColor(id: string): string {
  return PERSONA_COLORS[id] || 'bg-gray-500';
}

function getInitials(name: string): string {
  return name.slice(0, 1);
}

interface PersonaSwitcherProps {
  collapsed: boolean;
}

export function PersonaSwitcher({ collapsed }: PersonaSwitcherProps) {
  const { personas, loading } = usePersonas();
  const { activePersonaId, setActivePersonaId } = usePersonaStore();

  const activePersona = personas.find((p) => p.id === activePersonaId);

  const trigger = (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        className={cn(
          'w-full gap-2',
          collapsed ? 'justify-center px-2' : 'justify-start px-3'
        )}
        disabled={loading}
      >
        <Avatar className={cn('h-7 w-7', activePersona && getPersonaColor(activePersona.id))}>
          <AvatarFallback className="text-xs text-white bg-transparent">
            {activePersona ? getInitials(activePersona.name) : <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left text-sm">
              {activePersona?.name || zh.persona.noPersona}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </>
        )}
      </Button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {collapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">
            {activePersona?.name || zh.persona.selectPersona}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{zh.persona.switchLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {personas.map((persona) => (
          <DropdownMenuItem
            key={persona.id}
            onClick={() => setActivePersonaId(persona.id)}
            className="gap-2"
          >
            <Avatar className={cn('h-6 w-6', getPersonaColor(persona.id))}>
              <AvatarFallback className="text-xs text-white bg-transparent">
                {getInitials(persona.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{persona.name}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {persona.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
