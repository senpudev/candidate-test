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
 * 📝 TODO: El candidato debe completar este hook
 *
 * Funcionalidades a implementar:
 * 1. Manejo de estado de mensajes
 * 2. Integración con streaming de respuestas
 * 3. Persistencia de conversación
 * 4. Manejo de errores
 * 5. Nueva conversación
 *
 * Este hook debe abstraer toda la lógica del chat
 * para que el componente Chat sea más simple
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

  // TODO: Implementar streaming de respuestas
  const sendWithStreaming = useCallback(
    async (message: string) => {
      // 1. Añadir mensaje del usuario
      // 2. Iniciar conexión SSE o WebSocket
      // 3. Actualizar mensaje del asistente token por token
      // 4. Cerrar conexión al terminar

      // Por ahora usar la versión sin streaming
      sendMutation.mutate(message);
    },
    [sendMutation]
  );

  // TODO: Implementar nueva conversación
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

  // TODO: Implementar carga de historial
  const loadHistory = useCallback(async () => {
    if (!conversationId) return;

    try {
      const history = await api.getChatHistory(studentId, conversationId);
      // Transformar y establecer mensajes
      // setMessages(...)
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
