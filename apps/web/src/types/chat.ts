export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: { chunkSources?: { source: string; count: number }[] };
}

export interface ConversationItem {
  id: string;
  title: string;
  lastMessageAt?: string;
  messageCount: number;
  isActive?: boolean;
}

export interface UseChatOptions {
  studentId: string;
  onError?: (error: Error) => void;
}

export interface ApiMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: { chunkSources?: { source: string; count: number }[] };
}

export interface MessagesQueryData {
  messages?: ApiMessage[];
  total?: number;
}
