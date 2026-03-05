'use client';

import { useCallback, useRef } from 'react';
import { streamAgentChat } from '@/lib/sse';
import { useChatStore } from '@/stores/chat-store';
import { usePersonaStore } from '@/stores/persona-store';

export function useAgentStream() {
  const abortRef = useRef<AbortController | null>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);

  const sendMessage = useCallback(
    async (content: string) => {
      const store = useChatStore.getState();
      if (!activePersonaId) return;
      if (store.isStreaming) return;

      // Add user message
      store.addUserMessage(activePersonaId, content);

      // Start assistant message
      const assistantId = store.startAssistantMessage(activePersonaId);

      // Build message history for the API
      const messages = store.getMessages(activePersonaId);
      const apiMessages = messages
        .filter((m) => m.id !== assistantId)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const stream = streamAgentChat(
          '/api/agent',
          {
            messages: apiMessages,
            personaId: activePersonaId,
            stream: true,
          },
          controller.signal
        );

        for await (const event of stream) {
          const s = useChatStore.getState();
          switch (event.type) {
            case 'text':
              s.appendText(activePersonaId, assistantId, event.content, event.thinking);
              break;
            case 'tool_call':
              s.addToolCall(activePersonaId, assistantId, event.call);
              break;
            case 'tool_result':
              s.updateToolResult(activePersonaId, assistantId, event.result);
              break;
            case 'done':
              s.finishStream(activePersonaId, assistantId, event.message, event.model, event.usage);
              break;
            case 'error':
              s.appendText(activePersonaId, assistantId, `\n\n**错误**: ${event.error}`);
              s.setStreaming(false);
              break;
          }
        }
      } catch (err) {
        const s = useChatStore.getState();
        if ((err as Error).name !== 'AbortError') {
          s.appendText(activePersonaId, assistantId, `\n\n**错误**: ${(err as Error).message}`);
        }
        s.setStreaming(false);
      } finally {
        abortRef.current = null;
      }
    },
    [activePersonaId]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    useChatStore.getState().setStreaming(false);
  }, []);

  return {
    sendMessage,
    isStreaming,
    abort,
  };
}
