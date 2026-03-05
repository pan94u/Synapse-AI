'use client';

import { useChatStore, type UIMessage } from '@/stores/chat-store';
import { usePersonaStore } from '@/stores/persona-store';
import { useAgentStream } from '@/hooks/use-agent-stream';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ChatEmpty } from './chat-empty';

const EMPTY_MESSAGES: UIMessage[] = [];

export function ChatPanel() {
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const chat = useChatStore((s) => activePersonaId ? s.chats[activePersonaId] : undefined);
  const messages = chat?.messages ?? EMPTY_MESSAGES;
  const { sendMessage, isStreaming, abort } = useAgentStream();

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {hasMessages ? (
        <MessageList messages={messages} isStreaming={isStreaming} />
      ) : (
        <ChatEmpty />
      )}
      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        onStop={abort}
        disabled={!activePersonaId}
      />
    </div>
  );
}
