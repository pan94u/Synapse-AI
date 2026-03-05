'use client';

import { Bot, MessageSquare } from 'lucide-react';
import { usePersonaStore } from '@/stores/persona-store';
import { zh } from '@/messages/zh';

export function ChatEmpty() {
  const activePersona = usePersonaStore((s) => s.getActivePersona());

  if (!activePersona) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Bot className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{zh.app.name}</h2>
          <p className="mt-2 text-muted-foreground">{zh.chat.welcomeDefault}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-semibold">{activePersona.name}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{activePersona.description}</p>
      </div>
      <p className="text-sm text-muted-foreground">{zh.chat.emptyState}</p>
    </div>
  );
}
