import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseChatOptions {
  studentId: string;
  onError?: (error: Error) => void;
}

/**
 * TODO: Complete this hook
 */
export function useChat({ studentId, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();

  // Mutation para enviar mensajes
  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      return api.sendChatMessage({
        studentId,
        message,
        conversationId: conversationId || undefined,
      });
    },
    onMutate: async (message) => {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const userMessage: Message = {
        id: tempId,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      return { tempId };
    },
    onSuccess: (data, _, context) => {
      // Actualizar conversationId si es nueva
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Añadir respuesta del asistente
      const assistantMessage: Message = {
        id: data.assistantMessage._id,
        role: 'assistant',
        content: data.assistantMessage.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  // TODO: Implement streaming
  const sendWithStreaming = useCallback(
    async (message: string) => {
      // Placeholder - uses non-streaming version
      sendMutation.mutate(message);
    },
    [sendMutation]
  );

  // TODO: Implement new conversation
  const startNewConversation = useCallback(async () => {
    try {
      const result = await api.startNewConversation(studentId);
      setConversationId(result._id);
      setMessages([]);
      return result;
    } catch (error) {
      onError?.(error as Error);
    }
  }, [studentId, onError]);

  // TODO: Implement history loading
  const loadHistory = useCallback(async () => {
    if (!conversationId) return;

    try {
      const history = await api.getChatHistory(studentId, conversationId);
      // TODO: Transform and set messages
    } catch (error) {
      onError?.(error as Error);
    }
  }, [studentId, conversationId, onError]);

  return {
    messages,
    conversationId,
    isLoading: sendMutation.isPending,
    isStreaming,
    error: sendMutation.error,
    sendMessage: sendMutation.mutate,
    sendWithStreaming,
    startNewConversation,
    loadHistory,
    clearMessages: () => setMessages([]),
  };
}
