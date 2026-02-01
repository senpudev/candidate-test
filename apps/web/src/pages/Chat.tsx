import styled from 'styled-components';
import { Bot, Hand, Lightbulb, BookOpen, Trash2 } from 'lucide-react';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { useChat } from '../hooks/useChat';

interface ChatProps {
  studentId: string;
}

export function Chat({ studentId }: ChatProps) {
  const {
    conversations,
    conversationId,
    messages,
    isTyping,
    hasOlderMessages,
    loadingMore,
    loadOlderMessages,
    selectConversation,
    sendMessage,
    sendMessagePending,
    startNewConversation,
    startNewConversationPending,
    handleDeleteConversation,
    deleteConversationPending,
    formatConversationDate,
    messagesEndRef,
    messagesContainerRef,
    chatInputRef,
  } = useChat({ studentId });

  return (
    <Container>
      <Sidebar>
        <SidebarTitle>Conversaciones</SidebarTitle>
        <ConversationList>
          {conversations.length === 0 && (
            <SidebarEmpty>Sin conversaciones.</SidebarEmpty>
          )}
          {conversations.map((conv) => (
            <ConvRow
              key={conv.id}
              $active={conversationId === conv.id}
              onClick={() => selectConversation(conv.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && selectConversation(conv.id)}
            >
              <ConvContent $active={conversationId === conv.id}>
                <span>{conv.title || 'Conversación'}</span>
                <small>{formatConversationDate(conv.lastMessageAt)} · {conv.messageCount} mensajes</small>
              </ConvContent>
              <DeleteConvButton
                type="button"
                title="Eliminar conversación"
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                disabled={deleteConversationPending}
              >
                <Trash2 size={14} />
              </DeleteConvButton>
            </ConvRow>
          ))}
        </ConversationList>
      </Sidebar>

      <MainArea>
        <ChatHeader>
          <HeaderTitle>
            <HeaderIcon><Bot size={32} /></HeaderIcon>
            <div>
              <h2>Asistente de Estudios</h2>
              <HeaderSubtitle>Pregúntame sobre tus cursos</HeaderSubtitle>
            </div>
          </HeaderTitle>

          <NewChatButton
            onClick={startNewConversation}
            disabled={startNewConversationPending}
          >
            + Nueva conversación
          </NewChatButton>
        </ChatHeader>

        <MessagesContainer ref={messagesContainerRef}>
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
              <SuggestionButton onClick={() => sendMessage('¿Cómo puedo mejorar mi técnica de estudio?')}>
                <Lightbulb size={14} /> Técnicas de estudio
              </SuggestionButton>
              <SuggestionButton onClick={() => sendMessage('¿Qué curso me recomiendas empezar?')}>
                <BookOpen size={14} /> Recomendaciones
              </SuggestionButton>
            </SuggestionButtons>
          </WelcomeMessage>
        )}

        {hasOlderMessages && (
          <LoadMoreWrapper>
            <LoadMoreButton
              type="button"
              onClick={loadOlderMessages}
              disabled={loadingMore}
            >
              {loadingMore ? 'Cargando...' : 'Cargar mensajes anteriores'}
            </LoadMoreButton>
          </LoadMoreWrapper>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            chunkSources={message.metadata?.chunkSources}
          />
        ))}

        {isTyping && (
          <ChatMessage role="assistant" content="" isLoading />
        )}

        <div ref={messagesEndRef} />
        </MessagesContainer>

        <ChatInput
          ref={chatInputRef}
          onSend={sendMessage}
          disabled={sendMessagePending}
          placeholder="Escribe tu pregunta..."
        />
      </MainArea>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 48px);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 260px;
  min-width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarTitle = styled.h3`
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
`;

const ConvRow = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  border-radius: var(--radius-md);
  background: ${(p) => (p.$active ? 'var(--color-primary)' : 'transparent')};
  color: ${(p) => (p.$active ? 'white' : 'inherit')};
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$active ? 'var(--color-primary)' : 'var(--color-background)')};
  }

  &:hover button[title="Eliminar conversación"] {
    opacity: 1;
  }
`;

const ConvContent = styled.div<{ $active?: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 13px;
  text-align: left;
  color: ${(p) => (p.$active ? 'inherit' : 'var(--color-text-primary)')};

  span {
    font-weight: 500;
  }

  small {
    font-size: 11px;
    opacity: 0.85;
    margin-top: 2px;
  }
`;

const DeleteConvButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.2s ease, color 0.2s ease;

  &:hover {
    opacity: 1;
    color: var(--color-error);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SidebarEmpty = styled.p`
  padding: var(--spacing-md);
  font-size: 13px;
  color: var(--color-text-secondary);
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
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

const LoadMoreWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: var(--spacing-md);
`;

const LoadMoreButton = styled.button`
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 13px;
  color: var(--color-primary);
  background: transparent;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary);
    color: white;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
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
