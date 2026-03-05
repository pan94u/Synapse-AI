import { create } from 'zustand';
import type { ChatMessage, ToolCall, ToolResult, TokenUsage } from '@synapse/shared';

export interface UIToolCall extends ToolCall {
  status: 'running' | 'success' | 'error';
  result?: ToolResult;
}

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  toolCalls?: UIToolCall[];
  timestamp: number;
}

interface PersonaChat {
  messages: UIMessage[];
}

interface ChatState {
  chats: Record<string, PersonaChat>; // keyed by personaId
  isStreaming: boolean;
  streamingMessageId: string | null;
  lastModel: string | null;
  lastUsage: TokenUsage | null;

  getMessages: (personaId: string) => UIMessage[];
  addUserMessage: (personaId: string, content: string) => string;
  startAssistantMessage: (personaId: string) => string;
  appendText: (personaId: string, messageId: string, content: string, thinking?: string) => void;
  addToolCall: (personaId: string, messageId: string, call: ToolCall) => void;
  updateToolResult: (personaId: string, messageId: string, result: ToolResult) => void;
  finishStream: (personaId: string, messageId: string, finalMessage: ChatMessage, model: string, usage?: TokenUsage) => void;
  setStreaming: (streaming: boolean, messageId?: string | null) => void;
  clearChat: (personaId: string) => void;
}

const EMPTY_MESSAGES: UIMessage[] = [];

let _msgCounter = 0;
function nextId() {
  return `msg_${Date.now()}_${++_msgCounter}`;
}

function ensureChat(chats: Record<string, PersonaChat>, personaId: string): PersonaChat {
  if (!chats[personaId]) {
    chats[personaId] = { messages: [] };
  }
  return chats[personaId];
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: {},
  isStreaming: false,
  streamingMessageId: null,
  lastModel: null,
  lastUsage: null,

  getMessages: (personaId) => {
    return get().chats[personaId]?.messages ?? EMPTY_MESSAGES;
  },

  addUserMessage: (personaId, content) => {
    const id = nextId();
    set((state) => {
      const chats = { ...state.chats };
      const chat = ensureChat(chats, personaId);
      chat.messages = [...chat.messages, { id, role: 'user', content, timestamp: Date.now() }];
      return { chats };
    });
    return id;
  },

  startAssistantMessage: (personaId) => {
    const id = nextId();
    set((state) => {
      const chats = { ...state.chats };
      const chat = ensureChat(chats, personaId);
      chat.messages = [
        ...chat.messages,
        { id, role: 'assistant', content: '', timestamp: Date.now() },
      ];
      return { chats, isStreaming: true, streamingMessageId: id };
    });
    return id;
  },

  appendText: (personaId, messageId, content, thinking) => {
    set((state) => {
      const chat = state.chats[personaId];
      if (!chat) return state;

      const messages = chat.messages.map((m) => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          content: m.content + content,
          thinking: thinking ? (m.thinking || '') + thinking : m.thinking,
        };
      });

      return { chats: { ...state.chats, [personaId]: { ...chat, messages } } };
    });
  },

  addToolCall: (personaId, messageId, call) => {
    set((state) => {
      const chat = state.chats[personaId];
      if (!chat) return state;

      const messages = chat.messages.map((m) => {
        if (m.id !== messageId) return m;
        const toolCalls = [...(m.toolCalls || []), { ...call, status: 'running' as const }];
        return { ...m, toolCalls };
      });

      return { chats: { ...state.chats, [personaId]: { ...chat, messages } } };
    });
  },

  updateToolResult: (personaId, messageId, result) => {
    set((state) => {
      const chat = state.chats[personaId];
      if (!chat) return state;

      const messages = chat.messages.map((m) => {
        if (m.id !== messageId) return m;
        const toolCalls = (m.toolCalls || []).map((tc) => {
          if (tc.id !== result.callId) return tc;
          const newStatus: UIToolCall['status'] = result.isError ? 'error' : 'success';
          return { ...tc, status: newStatus, result };
        });
        return { ...m, toolCalls };
      });

      return { chats: { ...state.chats, [personaId]: { ...chat, messages } } };
    });
  },

  finishStream: (personaId, messageId, finalMessage, model, usage) => {
    set((state) => {
      const chat = state.chats[personaId];
      if (!chat) return state;

      const messages = chat.messages.map((m) => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          content: finalMessage.content || m.content,
          thinking: finalMessage.thinking || m.thinking,
        };
      });

      return {
        chats: { ...state.chats, [personaId]: { ...chat, messages } },
        isStreaming: false,
        streamingMessageId: null,
        lastModel: model,
        lastUsage: usage || null,
      };
    });
  },

  setStreaming: (streaming, messageId = null) => {
    set({ isStreaming: streaming, streamingMessageId: messageId });
  },

  clearChat: (personaId) => {
    set((state) => {
      const chats = { ...state.chats };
      delete chats[personaId];
      return { chats };
    });
  },
}));
