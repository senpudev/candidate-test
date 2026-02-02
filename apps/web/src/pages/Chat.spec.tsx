import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Chat } from './Chat';
import { api } from '../services/api';

// Mock del servicio API
jest.mock('../services/api', () => ({
  api: {
    sendChatMessage: jest.fn(),
    startNewConversation: jest.fn(),
    getChatHistory: jest.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Chat', () => {
  beforeEach(() => {
    (api.sendChatMessage as jest.Mock).mockResolvedValue({
      conversationId: 'conv-123',
      userMessage: { _id: 'msg-1', content: 'Test', role: 'user' },
      assistantMessage: {
        _id: 'msg-2',
        content: 'Response',
        role: 'assistant',
        createdAt: new Date().toISOString(),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ✅ TEST QUE PASA - Verifica renderizado inicial
   */
  it('should render welcome message when no messages', () => {
    renderWithProviders(<Chat studentId="test-id" />);

    expect(
      screen.getByText(/¡Hola! Soy tu asistente de estudios/)
    ).toBeInTheDocument();
  });

  /**
   * ✅ TEST QUE PASA - Verifica header del chat
   */
  it('should render chat header', () => {
    renderWithProviders(<Chat studentId="test-id" />);

    expect(screen.getByText('Asistente de Estudios')).toBeInTheDocument();
    expect(screen.getByText('+ Nueva conversación')).toBeInTheDocument();
  });

  /**
   * 📝 TODO: El candidato debe implementar estos tests
   */
  describe('Message sending', () => {
    it('should send message when clicking send button', async () => {
      renderWithProviders(<Chat studentId="test-id" />);

      const textarea = screen.getByPlaceholderText('Escribe tu pregunta...');
      await userEvent.type(textarea, 'Hola');

      const sendButton = screen.getByRole('button', { name: /➤/ });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(api.sendChatMessage).toHaveBeenCalledWith({
          studentId: 'test-id',
          message: 'Hola',
          conversationId: undefined,
        });
      });
    });
    it.todo('should send message when pressing Enter');
    it.todo('should show user message immediately (optimistic update)');
    it.todo('should show assistant response after API call');
    it.todo('should disable input while sending');
    it.todo('should show typing indicator while waiting for response');
  });

  describe('Streaming', () => {
    it.todo('should display tokens as they arrive');
    it.todo('should handle stream errors gracefully');
    it.todo('should complete message when stream ends');
  });

  describe('Conversation management', () => {
    it.todo('should start new conversation when button clicked');
    it.todo('should clear messages when starting new conversation');
    it.todo('should load history for existing conversation');
  });

  describe('Accessibility', () => {
    it.todo('should be keyboard navigable');
    it.todo('should have proper aria labels');
    it.todo('should announce new messages to screen readers');
  });

  describe('Error handling', () => {
    it.todo('should show error message when API fails');
    it.todo('should allow retry after error');
    it.todo('should handle network disconnection');
  });
});
