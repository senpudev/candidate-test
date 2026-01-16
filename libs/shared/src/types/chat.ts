export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata?: ChatMessageMetadata;
  createdAt?: Date;
}

export interface ChatMessageMetadata {
  tokensUsed?: number;
  model?: string;
  responseTime?: number;
}

export interface Conversation {
  id: string;
  studentId: string;
  title: string;
  isActive: boolean;
  lastMessageAt?: Date;
  messageCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SendMessageRequest {
  studentId: string;
  message: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  conversation: Conversation;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
