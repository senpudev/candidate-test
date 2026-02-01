import styled from 'styled-components';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
  chunkSources?: { source: string; count: number }[];
}

/**
 * 📝 TODO: El candidato debe completar este componente
 *
 * Funcionalidades a implementar:
 * 1. Formatear el contenido (markdown básico, code blocks)
 * 2. Mostrar indicador de "escribiendo" cuando isLoading=true
 * 3. Añadir animación de entrada para mensajes nuevos
 * 4. Mostrar timestamp formateado
 * 5. Manejar mensajes largos (expandir/colapsar)
 *
 * Bonus:
 * - Soporte para syntax highlighting en code blocks
 * - Botón para copiar código
 * - Reacciones a mensajes
 */
export function ChatMessage({ role, content, timestamp, isLoading, chunkSources }: ChatMessageProps) {
  // TODO: Implementar formateo de markdown

  return (
    <Container $role={role}>
      <Avatar $role={role}>{role === 'user' ? <User size={18} /> : <Bot size={18} />}</Avatar>

      <MessageContent $role={role}>
        {isLoading ? (
          <LoadingIndicator>
            {/* TODO: Implementar animación de typing */}
            <Dot />
            <Dot />
            <Dot />
          </LoadingIndicator>
        ) : (
          <>
            <MessageText>{content}</MessageText>
            {(timestamp || (role === 'assistant' && chunkSources?.length)) && (
              <MessageFooter>
                {role === 'assistant' && chunkSources && chunkSources.length > 0 && (
                  <RagSources>
                    {chunkSources.map(({ source, count }) => `(${count}) ${source}`).join(', ')}
                  </RagSources>
                )}
                {timestamp && <Timestamp>{formatTime(timestamp)}</Timestamp>}
              </MessageFooter>
            )}
          </>
        )}
      </MessageContent>
    </Container>
  );
}

// TODO: Mejorar formateo de tiempo
function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Container = styled.div<{ $role: string }>`
  display: flex;
  gap: var(--spacing-sm);
  flex-direction: ${(props) => (props.$role === 'user' ? 'row-reverse' : 'row')};
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
`;

const Avatar = styled.div<{ $role: string }>`
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: ${(props) => (props.$role === 'user' ? 'var(--color-primary)' : 'var(--color-background)')};
  color: ${(props) => (props.$role === 'user' ? 'white' : 'var(--color-text-secondary)')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MessageContent = styled.div<{ $role: string }>`
  max-width: 70%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  background: ${(props) => (props.$role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)')};
  color: ${(props) => (props.$role === 'user' ? 'white' : 'var(--color-text-primary)')};
  border: ${(props) => (props.$role === 'assistant' ? '1px solid var(--color-border)' : 'none')};
`;

const MessageText = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
`;

const MessageFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
`;

const Timestamp = styled.span`
  font-size: 11px;
  opacity: 0.7;
  margin-left: auto;
`;

const RagSources = styled.span`
  font-size: 11px;
  opacity: 0.8;
  color: var(--color-primary);
`;

const LoadingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: var(--spacing-xs);
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-text-secondary);
  /* TODO: Añadir animación bounce */
`;
