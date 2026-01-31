import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ChatMessage } from './schemas/chat-message.schema';
import { Conversation } from './schemas/conversation.schema';
import { SendMessageDto } from './dto/send-message.dto';

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

  const mockKnowledgeService = {
    searchSimilar: jest.fn(),
  };

  const studentId = new Types.ObjectId().toString();
  const conversationId = new Types.ObjectId().toString();

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
        {
          provide: KnowledgeService,
          useValue: mockKnowledgeService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should create user message and get AI response', async () => {
      const dto: SendMessageDto = {
        studentId,
        message: 'Hello',
      };
      const conversation = {
        _id: new Types.ObjectId(conversationId),
        studentId: new Types.ObjectId(studentId),
        title: 'Nueva conversación',
        isActive: true,
      };
      const userMessageDoc = { _id: new Types.ObjectId(), role: 'user', content: dto.message };
      const assistantMessageDoc = { _id: new Types.ObjectId(), role: 'assistant', content: 'Hi there!' };

      mockConversationModel.create.mockResolvedValue(conversation);
      mockChatMessageModel.find.mockResolvedValue([]);
      mockKnowledgeService.searchSimilar.mockResolvedValue([]);
      mockAiService.generateResponse.mockResolvedValue({
        content: 'Hi there!',
        tokensUsed: 10,
        model: 'gpt-4',
      });
      mockChatMessageModel.create
        .mockResolvedValueOnce(userMessageDoc)
        .mockResolvedValueOnce(assistantMessageDoc);
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(conversation);

      const result = await service.sendMessage(dto);

      expect(result.conversationId).toEqual(conversation._id);
      expect(result.userMessage).toEqual(userMessageDoc);
      expect(result.assistantMessage).toEqual(assistantMessageDoc);
      expect(mockChatMessageModel.create).toHaveBeenCalledTimes(2);
      expect(mockAiService.generateResponse).toHaveBeenCalledWith(
        dto.message,
        [],
        undefined
      );
    });

    it('should create new conversation if none exists', async () => {
      const dto: SendMessageDto = { studentId, message: 'Hi' };
      const newConversation = {
        _id: new Types.ObjectId(),
        studentId: new Types.ObjectId(studentId),
        title: 'Nueva conversación',
        isActive: true,
      };

      mockConversationModel.create.mockResolvedValue(newConversation);
      mockChatMessageModel.find.mockResolvedValue([]);
      mockKnowledgeService.searchSimilar.mockResolvedValue([]);
      mockAiService.generateResponse.mockResolvedValue({
        content: 'Hello',
        tokensUsed: 5,
        model: 'gpt-4',
      });
      mockChatMessageModel.create.mockResolvedValue({ _id: new Types.ObjectId() });
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(newConversation);

      await service.sendMessage(dto);

      expect(mockConversationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: expect.any(Types.ObjectId),
          title: 'Nueva conversación',
          isActive: true,
        })
      );
      expect(mockConversationModel.findById).not.toHaveBeenCalled();
    });

    it('should use existing conversation if provided', async () => {
      const dto: SendMessageDto = {
        studentId,
        message: 'Follow-up',
        conversationId,
      };
      const existingConversation = {
        _id: new Types.ObjectId(conversationId),
        studentId: new Types.ObjectId(studentId),
        title: 'Nueva conversación',
        isActive: true,
      };

      mockConversationModel.findById.mockResolvedValue(existingConversation);
      mockChatMessageModel.find.mockResolvedValue([]);
      mockKnowledgeService.searchSimilar.mockResolvedValue([]);
      mockAiService.generateResponse.mockResolvedValue({
        content: 'Reply',
        tokensUsed: 3,
        model: 'gpt-4',
      });
      mockChatMessageModel.create.mockResolvedValue({ _id: new Types.ObjectId() });
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(existingConversation);

      await service.sendMessage(dto);

      expect(mockConversationModel.findById).toHaveBeenCalledWith(conversationId);
      expect(mockConversationModel.create).not.toHaveBeenCalled();
    });

    it('should handle AI service errors gracefully', async () => {
      const dto: SendMessageDto = { studentId, message: 'Hi' };
      const conversation = {
        _id: new Types.ObjectId(),
        studentId: new Types.ObjectId(studentId),
        title: 'Nueva conversación',
        isActive: true,
      };

      mockConversationModel.create.mockResolvedValue(conversation);
      mockChatMessageModel.find.mockResolvedValue([]);
      mockKnowledgeService.searchSimilar.mockResolvedValue([]);
      mockAiService.generateResponse.mockRejectedValue(new Error('OpenAI API error'));

      await expect(service.sendMessage(dto)).rejects.toThrow('OpenAI API error');
    });
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
