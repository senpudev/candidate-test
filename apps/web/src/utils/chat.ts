import type { ApiMessage, Message } from '../types/chat';

export const CHAT_PAGE_SIZE = 10;

/** TanStack Query keys for chat (conversations list + messages per conversation). */
export const chatQueryKeys = {
  conversations: (studentId: string) => ['chatConversations', studentId] as const,
  messages: (studentId: string, conversationId: string) =>
    ['chatMessages', studentId, conversationId] as const,
};

/** Maps API message (createdAt) to UI Message (timestamp). */
export function toMessage(m: ApiMessage): Message {
  return {
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date(m.createdAt),
    metadata: m.metadata,
  };
}

/** Converts API message array to UI Message array; handles undefined. */
export function apiMessagesToMessages(apiMessages: ApiMessage[] | undefined): Message[] {
  return (apiMessages ?? []).map(toMessage);
}

/** Returns string id or empty string if null/undefined. */
export function normalizeId(id: string | undefined): string {
  return id != null ? String(id) : '';
}
