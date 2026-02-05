import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  CHAT_PAGE_SIZE,
  chatQueryKeys,
  apiMessagesToMessages,
  normalizeId,
  toMessage,
} from '../utils/chat';
import type { ApiMessage, ConversationItem, Message, UseChatOptions } from '../types/chat';

export type { Message, ConversationItem, UseChatOptions } from '../types/chat';

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
  const skipScrollRestoreRef = useRef(false);
  const scrollRestoreRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const streamingAbortRef = useRef<AbortController | null>(null);

  const { data: conversationsData } = useQuery({
    queryKey: chatQueryKeys.conversations(studentId),
    queryFn: () => api.getChatHistory(studentId),
    enabled: !!studentId,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: messagesData } = useQuery({
    queryKey: chatQueryKeys.messages(studentId, conversationId!),
    queryFn: () =>
      api.getChatHistory(studentId, conversationId!, 1, CHAT_PAGE_SIZE, true),
    enabled: !!studentId && !!conversationId,
  });

  const conversations: ConversationItem[] = Array.isArray(conversationsData?.conversations)
    ? conversationsData.conversations
    : [];

  useEffect(() => {
    if (!conversationId) return;
    if (messagesData?.messages == null) {
      setMessages([]);
      return;
    }
    setNextOlderPage(2);
    setMessages(apiMessagesToMessages(messagesData.messages as ApiMessage[]));
    setMessagesTotal(messagesData.total ?? 0);
  }, [conversationId, messagesData]);

  const hasOlderMessages = messagesTotal > (nextOlderPage - 1) * CHAT_PAGE_SIZE;

  const fetchMessagesPage = useCallback(
    async (convId: string, page: number, fromEnd: boolean) => {
      const data = await api.getChatHistory(studentId, convId, page, CHAT_PAGE_SIZE, fromEnd);
      return {
        messages: apiMessagesToMessages((data.messages ?? []) as ApiMessage[]),
        total: data.total ?? 0,
      };
    },
    [studentId]
  );

  const loadHistory = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { messages: msgs, total } = await fetchMessagesPage(conversationId, 1, true);
      setNextOlderPage(2);
      setMessages(msgs);
      setMessagesTotal(total);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [conversationId, fetchMessagesPage, onError]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingMore || !hasOlderMessages) return;
    setLoadingMore(true);
    try {
      const { messages: older } = await fetchMessagesPage(
        conversationId,
        nextOlderPage,
        true
      );
      const container = messagesContainerRef.current;
      if (container) {
        scrollRestoreRef.current = { scrollHeight: container.scrollHeight, scrollTop: container.scrollTop };
        skipScrollRestoreRef.current = true;
      }
      setMessages((prev) => [...older, ...prev]);
      setNextOlderPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, nextOlderPage, loadingMore, hasOlderMessages, fetchMessagesPage]);

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.sendChatMessage({ studentId, message, conversationId: conversationId ?? undefined }),
    onMutate: (message) => {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now()), role: 'user', content: message, timestamp: new Date() },
      ]);
      setIsTyping(true);
    },
    onSuccess: (data, message) => {
      const newConvId = normalizeId(data.conversationId?.toString?.() ?? data.conversationId);
      const convId = newConvId || (conversationId ?? '');
      if (!conversationId && newConvId) setConversationId(newConvId);

      setMessages((prev) => [
        ...prev,
        toMessage({
          id: String(data.assistantMessage._id),
          role: 'assistant',
          content: data.assistantMessage.content,
          createdAt: data.assistantMessage.createdAt,
          metadata: data.assistantMessage.metadata,
        }),
      ]);
      setMessagesTotal((prev) => prev + 2);
      setIsTyping(false);
      queryClient.refetchQueries({ queryKey: chatQueryKeys.conversations(studentId) });
      setTimeout(() => chatInputRef.current?.focus(), 0);
    },
    onError: (error: Error) => {
      setIsTyping(false);
      setTimeout(() => chatInputRef.current?.focus(), 0);
      onError?.(error);
    },
  });

  useEffect(() => {
    if (skipScrollRestoreRef.current) {
      skipScrollRestoreRef.current = false;
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

  const selectConversation = useCallback(
    (id: string) => {
      if (id === conversationId) return;
      if (isTyping) return; // Block switch until assistant has replied
      setConversationId(id);
      setMessages([]);
      setNextOlderPage(2);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(studentId, id) });
      queryClient.prefetchQuery({
        queryKey: chatQueryKeys.messages(studentId, id),
        queryFn: () => api.getChatHistory(studentId, id, 1, CHAT_PAGE_SIZE, true),
      });
    },
    [queryClient, studentId, conversationId, isTyping]
  );

  const startNewConversationMutation = useMutation({
    mutationFn: () => api.startNewConversation(studentId),
    onSuccess: (data) => {
      const id = normalizeId(data._id?.toString?.() ?? data._id);
      setConversationId(id);
      setMessages([]);
      queryClient.refetchQueries({ queryKey: chatQueryKeys.conversations(studentId) });
    },
    onError: (error: Error) => onError?.(error),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (convId: string) => api.deleteChatHistory(studentId, convId),
    onSuccess: (_, deletedId) => {
      queryClient.refetchQueries({ queryKey: chatQueryKeys.conversations(studentId) });
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
      if (window.confirm('¿Eliminar esta conversación?')) deleteConversationMutation.mutate(convId);
    },
    [deleteConversationMutation]
  );

  const formatConversationDate = useCallback((lastMessageAt?: string) => {
    if (!lastMessageAt) return '';
    const d = new Date(lastMessageAt);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }, []);

  // Cleanup: cancelar stream al desmontar
  useEffect(() => {
    return () => {
      if (streamingAbortRef.current) {
        streamingAbortRef.current.abort();
      }
    };
  }, []);

  const sendWithStreaming = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      if (isStreaming) return;

      const tempUserId = `user-temp-${Date.now()}`;
      const userMessage: Message = {
        id: tempUserId,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      setIsStreaming(true);

      const tempAssistantId = `assistant-temp-${Date.now()}`;

      const controller = api.streamChatResponse({
        studentId,
        message: trimmed,
        conversationId: conversationId ?? undefined,
        onChunk: (delta) => {
          setMessages((prev) => {
            const next = [...prev];
            const idx = next.findIndex((m) => m.id === tempAssistantId);
            if (idx === -1) {
              next.push({
                id: tempAssistantId,
                role: 'assistant',
                content: delta,
                timestamp: new Date(),
              });
            } else {
              const existing = next[idx];
              next[idx] = { ...existing, content: existing.content + delta };
            }
            return next;
          });
        },
        onDone: (payload) => {
          const newConvId = normalizeId(
            payload.conversationId?.toString?.() ?? payload.conversationId
          );
          const finalAssistant = payload.assistantMessage;

          if (!conversationId && newConvId) setConversationId(newConvId);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantId
                ? toMessage({
                  id: String(finalAssistant.id ?? finalAssistant._id),
                  role: 'assistant',
                  content: finalAssistant.content,
                  createdAt: finalAssistant.createdAt,
                  metadata: finalAssistant.metadata,
                })
                : m
            )
          );

          setMessagesTotal((prev) => prev + 2);
          setIsTyping(false);
          setIsStreaming(false);
          queryClient.refetchQueries({ queryKey: chatQueryKeys.conversations(studentId) });
          setTimeout(() => chatInputRef.current?.focus(), 0);
        },
        onError: (err) => {
          setIsTyping(false);
          setIsStreaming(false);
          setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
          onError?.(err);
          setTimeout(() => chatInputRef.current?.focus(), 0);
        },
      });

      streamingAbortRef.current = controller;
    },
    [studentId, conversationId, isStreaming, queryClient, onError]
  );

  return {
    messages,
    conversationId,
    conversations,
    messagesTotal,
    isTyping,
    hasOlderMessages,
    loadingMore,
    loadHistory,
    loadOlderMessages,
    selectConversation,
    sendMessage: sendMutation.mutate,
    sendWithStreaming,
    startNewConversation: () => startNewConversationMutation.mutate(),
    handleDeleteConversation,
    clearMessages: () => setMessages([]),
    isLoading: sendMutation.isPending,
    sendMessagePending: sendMutation.isPending,
    startNewConversationPending: startNewConversationMutation.isPending,
    deleteConversationPending: deleteConversationMutation.isPending,
    formatConversationDate,
    error: sendMutation.error,
    messagesEndRef,
    messagesContainerRef,
    chatInputRef,
  };
}
