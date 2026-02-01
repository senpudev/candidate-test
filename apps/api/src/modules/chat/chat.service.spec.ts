import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ChatMessage } from './schemas/chat-message.schema';
import { Conversation } from './schemas/conversation.schema';
import { SendMessageDto } from './dto/send-message.dto';

const STUDENT_ID = '507f1f77bcf86cd799439011';
const CONVERSATION_ID = '507f1f77bcf86cd799439012';

describe('ChatService', () => {
  let service: ChatService;

  const mockChatMessageModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    }),
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
    searchSimilar: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    mockChatMessageModel.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    mockConversationModel.create.mockResolvedValue({
      _id: new Types.ObjectId(CONVERSATION_ID),
      studentId: new Types.ObjectId(STUDENT_ID),
      title: 'Nueva conversación',
      isActive: true,
    });
    mockConversationModel.findById.mockResolvedValue(null);
    mockConversationModel.findByIdAndUpdate.mockResolvedValue({});
    mockChatMessageModel.create.mockImplementation((doc: { content: string; role: string }) =>
      Promise.resolve({ _id: new Types.ObjectId(), ...doc })
    );
    mockAiService.generateResponse.mockResolvedValue({
      content: 'AI reply',
      tokensUsed: 10,
      model: 'gpt-4',
    });

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
    jest.restoreAllMocks(); // Restore original implementations (e.g. Logger.prototype.error) so mocks from one test don't leak into the next.
  });

  /**
   * Nota: Hay un BUG intencional en startNewConversation (historial por referencia).
   */
  describe('sendMessage', () => {
    const baseDto: SendMessageDto = {
      studentId: STUDENT_ID,
      message: 'Hello',
    };

    it('should create user message and get AI response', async () => {
      const result = await service.sendMessage(baseDto);

      expect(mockChatMessageModel.create).toHaveBeenCalledTimes(2); // user + assistant
      expect(mockChatMessageModel.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ role: 'user', content: 'Hello' }));
      expect(mockAiService.generateResponse).toHaveBeenCalledWith('Hello', [], undefined);
      expect(result).toMatchObject({
        conversationId: expect.anything(),
        userMessage: expect.objectContaining({ content: 'Hello', role: 'user' }),
        assistantMessage: expect.objectContaining({ content: 'AI reply', role: 'assistant' }),
      });
    });

    it('should create new conversation if none exists', async () => {
      await service.sendMessage(baseDto);

      expect(mockConversationModel.findById).not.toHaveBeenCalled();
      expect(mockConversationModel.create).toHaveBeenCalledTimes(1);
      expect(mockConversationModel.create).toHaveBeenCalledWith(expect.objectContaining({ studentId: expect.anything() }));
    });

    it('should use existing conversation if provided', async () => {
      const existingConv = {
        _id: new Types.ObjectId(CONVERSATION_ID),
        studentId: new Types.ObjectId(STUDENT_ID),
        title: 'Existing',
        isActive: true,
      };
      mockConversationModel.findById.mockResolvedValueOnce(existingConv);

      await service.sendMessage({ ...baseDto, conversationId: CONVERSATION_ID });

      expect(mockConversationModel.findById).toHaveBeenCalledWith(CONVERSATION_ID);
      expect(mockConversationModel.create).not.toHaveBeenCalled();
      expect(mockChatMessageModel.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ conversationId: existingConv._id }));
    });

    it('should handle AI service errors gracefully', async () => {
      mockAiService.generateResponse.mockRejectedValueOnce(new Error('OpenAI error'));

      await expect(service.sendMessage(baseDto)).rejects.toThrow('OpenAI error');
    });
  });

  describe('startNewConversation', () => {
    it('should create a new conversation', async () => {
      const result = await service.startNewConversation(STUDENT_ID);

      expect(mockConversationModel.create).toHaveBeenCalledTimes(1);
      expect(mockConversationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: expect.any(Types.ObjectId),
          title: 'Nueva conversación',
          isActive: true,
        })
      );
      expect(result).toMatchObject({
        _id: expect.anything(),
        studentId: expect.anything(),
        title: 'Nueva conversación',
        isActive: true,
      });
    });

    it('should mark previous conversations as inactive', async () => {
      await service.startNewConversation(STUDENT_ID);

      expect(mockConversationModel.updateMany).toHaveBeenCalledWith(
        {
          studentId: new Types.ObjectId(STUDENT_ID),
          _id: { $ne: expect.any(Types.ObjectId) },
        },
        { isActive: false }
      );
    });

    it('should initialize empty history for new conversation', async () => {
      const result = await service.startNewConversation(STUDENT_ID);
      const conversationIdStr = result._id.toString();

      const history = await (service as any).getConversationHistory(conversationIdStr);
      expect(history).toEqual([]);
    });

    it('should add initialContext as system message when provided', async () => {
      const result = await service.startNewConversation(STUDENT_ID, 'Eres un tutor de TypeScript');
      const conversationIdStr = result._id.toString();

      const history = await (service as any).getConversationHistory(conversationIdStr);
      expect(history).toEqual([{ role: 'system', content: 'Eres un tutor de TypeScript' }]);
    });

    // History should not be affected by previous conversations. (Bug test)
    it('should not affect history of previous conversations (BUG TEST)', async () => {
      // Simulate two conversations: first with history, second without.
      const previousConvId = new Types.ObjectId();
      mockConversationModel.create
        .mockResolvedValueOnce({
          _id: previousConvId,
          studentId: new Types.ObjectId(STUDENT_ID),
          title: 'Conversación anterior',
          isActive: true,
        })
        .mockResolvedValueOnce({
          _id: new Types.ObjectId(),
          studentId: new Types.ObjectId(STUDENT_ID),
          title: 'Nueva conversación',
          isActive: true,
        });

      const firstConv = await service.startNewConversation(STUDENT_ID);
      const firstIdStr = firstConv._id.toString();
      
      // Add messages to the history of the first conversation (simulates sendMessage)
      const cachedHistory = await (service as any).getConversationHistory(firstIdStr);
      cachedHistory.push({ role: 'user', content: 'Hola' }, { role: 'assistant', content: 'Hola!' });

      const secondConv = await service.startNewConversation(STUDENT_ID);
      const secondIdStr = secondConv._id.toString();

      const historyFirst = await (service as any).getConversationHistory(firstIdStr);
      const historySecond = await (service as any).getConversationHistory(secondIdStr);

      expect(historyFirst).toHaveLength(2);
      expect(historyFirst).toEqual([
        { role: 'user', content: 'Hola' },
        { role: 'assistant', content: 'Hola!' },
      ]);
      expect(historySecond).toEqual([]);
    });
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
