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
 * 📝 TODO: El candidato puede mejorar este servicio:
 * - Añadir interceptores para manejo de errores global
 * - Implementar retry logic
 * - Añadir logging de requests
 * - Implementar cache de requests
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

  // TODO: Implementar cuando el candidato complete el endpoint
  getStats: async (studentId: string) => {
    const response = await apiClient.get(`/students/${studentId}/stats`);
    return response.data;
  },

  // TODO: Implementar cuando el candidato complete el endpoint
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

  // TODO: Implementar streaming
  // El candidato debe implementar un método para manejar SSE o WebSocket
  // streamChatResponse: (conversationId: string, onMessage: (token: string) => void) => {
  //   // Implementar EventSource para SSE
  //   // O WebSocket para conexión bidireccional
  // },
};

// Interceptor para manejo de errores (básico)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: El candidato puede mejorar el manejo de errores
    console.error('API Error:', error.response?.data || error.message);

    // Transformar el error para mejor UX
    const message = error.response?.data?.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);
