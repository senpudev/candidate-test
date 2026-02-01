import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

const PAGE_SIZE = 10;

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

interface UseChatOptions {
  studentId: string;
  onError?: (error: Error) => void;
}

interface ApiMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: { chunkSources?: { source: string; count: number }[] };
}

function toMessage(m: ApiMessage): Message {
  return {
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date(m.createdAt),
    metadata: m.metadata,
  };
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
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [nextOlderPage, setNextOlderPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const skipNextScrollToBottomRef = useRef(false);
  const scrollRestoreRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

  // Lista de conversaciones
  const { data: historyData } = useQuery({
    queryKey: ['chatConversations', studentId],
    queryFn: () => api.getChatHistory(studentId),
    enabled: !!studentId,
    staleTime: 0,
    refetchOnMount: true,
  });
  const conversations: ConversationItem[] = Array.isArray(historyData?.conversations)
    ? historyData.conversations
    : [];

  // Mensajes iniciales: últimos PAGE_SIZE (fromEnd=true, page=1)
  const { data: messagesData } = useQuery({
    queryKey: ['chatMessages', studentId, conversationId],
    queryFn: () =>
      api.getChatHistory(studentId, conversationId ?? undefined, 1, PAGE_SIZE, true),
    enabled: !!studentId && !!conversationId,
  });

  useEffect(() => {
    if (messagesData?.messages == null || !conversationId) return;
    setNextOlderPage(2);
    setMessages((messagesData.messages as ApiMessage[]).map(toMessage));
    setMessagesTotal(messagesData.total ?? 0);
  }, [conversationId, messagesData]);

  const hasOlderMessages = messagesTotal > (nextOlderPage - 1) * PAGE_SIZE;

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingMore || !hasOlderMessages) return;
    setLoadingMore(true);
    try {
      const data = await api.getChatHistory(
        studentId,
        conversationId,
        nextOlderPage,
        PAGE_SIZE,
        true
      );
      const older = ((data.messages ?? []) as ApiMessage[]).map(toMessage);
      const container = messagesContainerRef.current;
      if (container) {
        scrollRestoreRef.current = { scrollHeight: container.scrollHeight, scrollTop: container.scrollTop };
      }
      skipNextScrollToBottomRef.current = true;
      setMessages((prev) => [...older, ...prev]);
      setNextOlderPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [studentId, conversationId, nextOlderPage, loadingMore, hasOlderMessages]);

  /** Carga el historial de la conversación actual desde el backend (últimos N mensajes). */
  const loadHistory = useCallback(async () => {
    if (!conversationId) return;
    try {
      const data = await api.getChatHistory(studentId, conversationId, 1, PAGE_SIZE, true);
      setNextOlderPage(2);
      setMessages(((data.messages ?? []) as ApiMessage[]).map(toMessage));
      setMessagesTotal(data.total ?? 0);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [studentId, conversationId, onError]);

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.sendChatMessage({ studentId, message, conversationId: conversationId || undefined }),
    onMutate: (message) => {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now()), role: 'user', content: message, timestamp: new Date() },
      ]);
      setIsTyping(true);
    },
    onSuccess: (data) => {
      const newConvId = data.conversationId?.toString?.() ?? data.conversationId;
      if (!conversationId && newConvId) {
        setConversationId(typeof newConvId === 'string' ? newConvId : String(newConvId));
      }
      setMessages((prev) => [
        ...prev,
        toMessage({
          id: data.assistantMessage._id,
          role: 'assistant',
          content: data.assistantMessage.content,
          createdAt: data.assistantMessage.createdAt,
          metadata: data.assistantMessage.metadata,
        }),
      ]);
      setMessagesTotal((prev) => prev + 2);
      setIsTyping(false);
      queryClient.refetchQueries({ queryKey: ['chatConversations', studentId] });
      setTimeout(() => chatInputRef.current?.focus(), 0);
    },
    onError: (error: Error) => {
      setIsTyping(false);
      setTimeout(() => chatInputRef.current?.focus(), 0);
      onError?.(error);
    },
  });

  useEffect(() => {
    if (skipNextScrollToBottomRef.current) {
      skipNextScrollToBottomRef.current = false;
      const container = messagesContainerRef.current;
      const restore = scrollRestoreRef.current;
      if (container && restore) {
        container.scrollTop = restore.scrollTop + (container.scrollHeight - restore.scrollHeight);
        scrollRestoreRef.current = null;
      }
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const selectConversation = useCallback((id: string) => {
    setConversationId(id);
    setMessages([]);
  }, []);

  const startNewConversationMutation = useMutation({
    mutationFn: () => api.startNewConversation(studentId),
    onSuccess: (data) => {
      const id = data._id?.toString?.() ?? data._id;
      setConversationId(typeof id === 'string' ? id : String(id));
      setMessages([]);
      queryClient.refetchQueries({ queryKey: ['chatConversations', studentId] });
    },
    onError: (error: Error) => onError?.(error),
  });

  const startNewConversation = useCallback(() => {
    startNewConversationMutation.mutate();
  }, [startNewConversationMutation]);

  const deleteConversationMutation = useMutation({
    mutationFn: (convId: string) => api.deleteChatHistory(studentId, convId),
    onSuccess: (_, deletedId) => {
      queryClient.refetchQueries({ queryKey: ['chatConversations', studentId] });
      if (conversationId === deletedId) {
        setConversationId(null);
        setMessages([]);
      }
    },
    onError: (error: Error) => onError?.(error),
  });

  const handleDeleteConversation = useCallback(
    (e: React.MouseEvent, convId: string) => {
      e.stopPropagation();
      if (window.confirm('¿Eliminar esta conversación?')) {
        deleteConversationMutation.mutate(convId);
      }
    },
    [deleteConversationMutation]
  );

  const formatConversationDate = useCallback((lastMessageAt?: string) => {
    if (!lastMessageAt) return '';
    const d = new Date(lastMessageAt);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }, []);

  /** Por ahora sin streaming en backend; delega en sendMessage. */
  const sendWithStreaming = useCallback(
    (message: string) => {
      sendMutation.mutate(message);
    },
    [sendMutation]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    // Estado
    messages,
    conversationId,
    conversations,
    messagesTotal,
    isTyping,
    isStreaming,
    hasOlderMessages,
    loadingMore,
    // Acciones
    loadHistory,
    loadOlderMessages,
    selectConversation,
    sendMessage: sendMutation.mutate,
    sendWithStreaming,
    startNewConversation,
    handleDeleteConversation,
    clearMessages,
    // Pendientes
    isLoading: sendMutation.isPending,
    sendMessagePending: sendMutation.isPending,
    startNewConversationPending: startNewConversationMutation.isPending,
    deleteConversationPending: deleteConversationMutation.isPending,
    // Util y refs
    formatConversationDate,
    error: sendMutation.error,
    messagesEndRef,
    messagesContainerRef,
    chatInputRef,
  };
}
