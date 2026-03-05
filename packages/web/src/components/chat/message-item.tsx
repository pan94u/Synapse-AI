'use client';

import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageContent } from './message-content';
import { ThinkingBlock } from './thinking-block';
import { ToolCallCard } from './tool-call-card';
import type { UIMessage } from '@/stores/chat-store';

interface MessageItemProps {
  message: UIMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}>
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'bg-primary' : 'bg-muted')}>
        <AvatarFallback className="bg-transparent">
          {isUser ? (
            <User className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-muted-foreground" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser && 'items-end')}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground text-sm">
            {message.content}
          </div>
        ) : (
          <div className="space-y-1">
            {message.thinking && <ThinkingBlock thinking={message.thinking} />}
            {message.toolCalls?.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
            {message.content && (
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2">
                <MessageContent content={message.content} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
