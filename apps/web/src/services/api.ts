import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Service para comunicación con el backend
 *
 * Completado:
 * - Interceptor de respuesta para errores global (mensaje legible, Promise.reject).
 * - Retry y cache: delegados en TanStack Query (useQuery reintenta por defecto y cachea por queryKey; no se duplican en esta capa).
 * - Todos los endpoints implementados (dashboard, courses, stats, preferences, chat, conversaciones/mensajes).
 */
export const api = {
  // === Student Endpoints ===

  getDashboard: async (studentId: string) => {
    const response = await apiClient.get(`/students/${studentId}/dashboard`);
    return response.data;
  },

  getCourses: async (studentId: string) => {
    const response = await apiClient.get(`/students/${studentId}/courses`);
    return response.data;
  },

  getStats: async (studentId: string) => {
    const response = await apiClient.get(`/students/${studentId}/stats`);
    return response.data;
  },

  updatePreferences: async (studentId: string, preferences: any) => {
    const response = await apiClient.patch(`/students/${studentId}/preferences`, preferences);
    return response.data;
  },

  // === Chat Endpoints ===

  sendChatMessage: async (data: {
    studentId: string;
    message: string;
    conversationId?: string;
  }) => {
    const response = await apiClient.post('/chat/message', data);
    return response.data;
  },

  startNewConversation: async (studentId: string, initialContext?: string) => {
    const response = await apiClient.post('/chat/conversation/new', {
      studentId,
      initialContext,
    });
    return response.data;
  },

  // Sin conversationId: lista de conversaciones (GET /conversations/:studentId). Con conversationId: mensajes paginados (GET /conversations/:studentId/:conversationId/messages). fromEnd=true → página 1 = últimos N mensajes.
  getChatHistory: async (
    studentId: string,
    conversationId?: string,
    page?: number,
    limit?: number,
    fromEnd?: boolean
  ) => {
    if (!conversationId) {
      const response = await apiClient.get(`/chat/conversations/${studentId}`);
      return response.data;
    }
    const params: Record<string, string | number | boolean> = {};
    if (page != null) params.page = page;
    if (limit != null) params.limit = limit;
    if (fromEnd != null) params.fromEnd = fromEnd;
    const response = await apiClient.get(
      `/chat/conversations/${studentId}/${conversationId}/messages`,
      { params }
    );
    return response.data;
  },

  deleteChatHistory: async (studentId: string, conversationId: string) => {
    const response = await apiClient.delete(
      `/chat/conversations/${studentId}/${conversationId}`
    );
    return response.data;
  },

  // Single POST: body with message, streamed response in the body (NDJSON).
  // Read the stream line by line and call onChunk / onDone / onError.
  // Return an AbortController to cancel the request if needed.
  streamChatResponse: (params: {
    studentId: string;
    message: string;
    conversationId?: string;
    onChunk: (delta: string) => void;
    onDone: (payload: { conversationId: string; userMessage: any; assistantMessage: any }) => void;
    onError?: (error: Error) => void;
  }): AbortController => {
    const { studentId, message, conversationId, onChunk, onDone, onError } = params;
    const baseURL = apiClient.defaults.baseURL ?? '';
    const url = `${baseURL}/chat/message/stream`;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, message, conversationId }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(res.status === 400 ? errBody || 'Datos inválidos' : `Error ${res.status}: ${errBody || res.statusText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No se puede leer el stream');

        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const obj = JSON.parse(trimmed) as { type: string; delta?: string; message?: string; conversationId?: string; userMessage?: any; assistantMessage?: any };
              if (obj.type === 'chunk' && obj.delta != null) onChunk(obj.delta);
              else if (obj.type === 'done') onDone({ conversationId: obj.conversationId!, userMessage: obj.userMessage!, assistantMessage: obj.assistantMessage! });
              else if (obj.type === 'error') throw new Error(obj.message ?? 'Error en el stream');
            } catch (e) {
              if (e instanceof SyntaxError) console.error('NDJSON parse error:', trimmed, e);
              else throw e;
            }
          }
        }
        if (buffer.trim()) {
          try {
            const obj = JSON.parse(buffer.trim()) as { type: string; delta?: string; conversationId?: string; userMessage?: any; assistantMessage?: any };
            if (obj.type === 'chunk' && obj.delta != null) onChunk(obj.delta);
            else if (obj.type === 'done') onDone({ conversationId: obj.conversationId!, userMessage: obj.userMessage!, assistantMessage: obj.assistantMessage! });
          } catch (_) { }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Stream error:', err);
        onError?.(err as Error);
      }
    })();

    return controller;
  },
};

// Interceptor para manejo de errores (básico)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

    // Transformar el error para mejor UX
    const message = error.response?.data?.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);
