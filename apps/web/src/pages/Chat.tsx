import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Bot, Hand, Lightbulb, BookOpen } from 'lucide-react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { api } from '../services/api';

interface ChatProps {
  studentId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * 📝 TODO: El candidato debe completar esta página
 *
 * Funcionalidades a implementar:
 * 1. Cargar historial de conversación
 * 2. Implementar streaming de respuestas (mostrar token por token)
 * 3. Manejar errores de API
 * 4. Implementar "Nueva conversación"
 * 5. Auto-scroll al nuevo mensaje
 * 6. Indicador de "escribiendo..."
 *
 * Bonus:
 * - Persistir conversación en localStorage
 * - Botón para limpiar historial
 * - Exportar conversación
 */
export function Chat({ studentId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // TODO: Implementar carga del historial
  // const { data: history } = useQuery({
  //   queryKey: ['chatHistory', studentId, conversationId],
  //   queryFn: () => api.getChatHistory(studentId, conversationId),
  //   enabled: !!conversationId,
  // });

  // Mutation para enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      api.sendChatMessage({
        studentId,
        message,
        conversationId: conversationId || undefined,
      }),
    onMutate: (message) => {
      // Añadir mensaje del usuario optimísticamente
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
    },
    onSuccess: (data) => {
      // Actualizar con la respuesta del asistente
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: data.assistantMessage._id,
        role: 'assistant',
        content: data.assistantMessage.content,
        timestamp: new Date(data.assistantMessage.createdAt),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setIsTyping(false);
      // TODO: Mostrar error al usuario
    },
  });

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // TODO: Implementar nueva conversación
  const handleNewConversation = async () => {
    // setMessages([]);
    // setConversationId(null);
    // TODO: Llamar a api.startNewConversation(studentId)
    alert('TODO: Implementar nueva conversación');
  };

  return (
    <Container>
      <ChatHeader>
        <HeaderTitle>
          <HeaderIcon><Bot size={32} /></HeaderIcon>
          <div>
            <h2>Asistente de Estudios</h2>
            <HeaderSubtitle>Pregúntame sobre tus cursos</HeaderSubtitle>
          </div>
        </HeaderTitle>

        <NewChatButton onClick={handleNewConversation}>
          + Nueva conversación
        </NewChatButton>
      </ChatHeader>

      <MessagesContainer>
        {messages.length === 0 && (
          <WelcomeMessage>
            <WelcomeIcon><Hand size={48} /></WelcomeIcon>
            <WelcomeTitle>¡Hola! Soy tu asistente de estudios</WelcomeTitle>
            <WelcomeText>
              Puedo ayudarte con:
              <ul>
                <li>Dudas sobre el contenido de tus cursos</li>
                <li>Técnicas de estudio y organización</li>
                <li>Motivación y consejos</li>
              </ul>
            </WelcomeText>
            <SuggestionButtons>
              <SuggestionButton onClick={() => sendMessageMutation.mutate('¿Cómo puedo mejorar mi técnica de estudio?')}>
                <Lightbulb size={14} /> Técnicas de estudio
              </SuggestionButton>
              <SuggestionButton onClick={() => sendMessageMutation.mutate('¿Qué curso me recomiendas empezar?')}>
                <BookOpen size={14} /> Recomendaciones
              </SuggestionButton>
            </SuggestionButtons>
          </WelcomeMessage>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}

        {/* TODO: Implementar indicador de typing con streaming */}
        {isTyping && (
          <ChatMessage role="assistant" content="" isLoading />
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      <ChatInput
        onSend={(message) => sendMessageMutation.mutate(message)}
        disabled={sendMessageMutation.isPending}
        placeholder="Escribe tu pregunta..."
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  overflow: hidden;
`;

const ChatHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  h2 {
    font-size: 16px;
    font-weight: 600;
  }
`;

const HeaderIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
`;

const HeaderSubtitle = styled.p`
  font-size: 13px;
  color: var(--color-text-secondary);
`;

const NewChatButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 13px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
`;

const WelcomeMessage = styled.div`
  text-align: center;
  max-width: 400px;
  margin: var(--spacing-xl) auto;
`;

const WelcomeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
`;

const WelcomeTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
`;

const WelcomeText = styled.div`
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: var(--spacing-lg);

  ul {
    text-align: left;
    margin-top: var(--spacing-sm);
    padding-left: var(--spacing-lg);
  }

  li {
    margin-bottom: var(--spacing-xs);
  }
`;

const SuggestionButtons = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  flex-wrap: wrap;
`;

const SuggestionButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 13px;
  color: var(--color-text-primary);
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
`;
