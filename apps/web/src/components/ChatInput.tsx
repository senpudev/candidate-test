import { useState, KeyboardEvent, ChangeEvent, forwardRef } from 'react';
import styled from 'styled-components';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * 📝 TODO: El candidato debe completar este componente
 *
 * Funcionalidades a implementar:
 * 1. Enviar mensaje con Enter (Shift+Enter para nueva línea)
 * 2. Auto-resize del textarea según contenido
 * 3. Límite de caracteres con contador
 * 4. Estado de disabled mientras se envía
 * 5. Limpiar input después de enviar
 *
 * Bonus:
 * - Soporte para emojis
 * - Historial de mensajes con flechas arriba/abajo
 * - Indicador de caracteres restantes
 */
export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({ onSend, disabled = false, placeholder = 'Escribe tu mensaje...' }, ref) {
    const MAX_LENGTH = 500;
    const [message, setMessage] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);

      // adjust textarea height based on content
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    const handleSend = () => {
      const trimmed = message.trim();
      if (trimmed && !disabled) {
        onSend(trimmed);
        setMessage('');
      }
    };

    return (
      <Container>
        <InputWrapper>
          <TextArea
            ref={ref}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            maxLength={MAX_LENGTH}
          />
          <CharCounter>
            {message.length}/{MAX_LENGTH}
          </CharCounter>
        </InputWrapper>

        <SendButton onClick={handleSend} disabled={disabled || !message.trim()}>
          {/* TODO: Cambiar icono cuando está enviando */}
          ➤
        </SendButton>
      </Container>
    );
  }
);

const Container = styled.div`
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
  min-height: 44px;
  max-height: 120px;

  &:focus {
    border-color: var(--color-primary);
  }

  &:disabled {
    background: var(--color-background);
    cursor: not-allowed;
  }
`;

const CharCounter = styled.div`
  position: absolute;
  right: 12px;
  bottom: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  border: none;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary-dark);
  }

  &:disabled {
    background: var(--color-border);
    cursor: not-allowed;
  }
`;
