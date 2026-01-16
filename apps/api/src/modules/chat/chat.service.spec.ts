import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { ChatMessage } from './schemas/chat-message.schema';
import { Conversation } from './schemas/conversation.schema';

describe('ChatService', () => {
  let service: ChatService;

  const mockChatMessageModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockConversationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockAiService = {
    generateResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getModelToken(ChatMessage.name),
          useValue: mockChatMessageModel,
        },
        {
          provide: getModelToken(Conversation.name),
          useValue: mockConversationModel,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 📝 TODO: El candidato debe implementar estos tests
   *
   * Nota: Hay un BUG intencional en el método startNewConversation
   * que el candidato debería descubrir al escribir estos tests.
   * El historial de mensajes se pasa por referencia en vez de copiarse,
   * lo que causa que el historial de conversaciones anteriores se borre.
   */
  describe('sendMessage', () => {
    it.todo('should create user message and get AI response');
    it.todo('should create new conversation if none exists');
    it.todo('should use existing conversation if provided');
    it.todo('should handle AI service errors gracefully');
  });

  describe('startNewConversation', () => {
    it.todo('should create a new conversation');
    it.todo('should mark previous conversations as inactive');
    it.todo('should initialize empty history for new conversation');
    /**
     * 🐛 Este test debería fallar debido al bug intencional
     * El candidato debe descubrir el bug y proponer una solución
     */
    it.todo('should not affect history of previous conversations (BUG TEST)');
  });

  describe('getHistory', () => {
    it.todo('should return paginated chat history');
    it.todo('should filter by conversationId when provided');
    it.todo('should return messages in chronological order');
  });

  describe('deleteHistory', () => {
    it.todo('should delete all messages from conversation');
    it.todo('should clear cache for deleted conversation');
    it.todo('should throw error if conversation not found');
  });

  describe('streamResponse', () => {
    it.todo('should stream AI response tokens');
    it.todo('should handle streaming errors');
    it.todo('should complete stream correctly');
  });
});
