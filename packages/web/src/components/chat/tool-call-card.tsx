'use client';

import { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, Loader2, Check, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { UIToolCall } from '@/stores/chat-store';
import { zh } from '@/messages/zh';

interface ToolCallCardProps {
  toolCall: UIToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [open, setOpen] = useState(false);

  const statusIcon = {
    running: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
    success: <Check className="h-3.5 w-3.5 text-green-500" />,
    error: <X className="h-3.5 w-3.5 text-red-500" />,
  }[toolCall.status];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="my-1.5">
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors">
        <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 font-medium">{toolCall.name}</span>
        {statusIcon}
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 space-y-2 rounded-lg border bg-muted/20 p-3">
          {/* Arguments */}
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">参数</div>
            <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
          {/* Result */}
          {toolCall.result && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {zh.chat.toolResult}
              </div>
              <pre className="overflow-x-auto rounded bg-muted p-2 text-xs max-h-[200px] overflow-y-auto">
                {toolCall.result.content}
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
