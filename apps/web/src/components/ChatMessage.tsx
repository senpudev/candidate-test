import styled from 'styled-components';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
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
export function ChatMessage({ role, content, timestamp, isLoading }: ChatMessageProps) {
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
            {timestamp && <Timestamp>{formatTime(timestamp)}</Timestamp>}
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

const Timestamp = styled.div`
  font-size: 11px;
  opacity: 0.7;
  margin-top: var(--spacing-xs);
  text-align: right;
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
