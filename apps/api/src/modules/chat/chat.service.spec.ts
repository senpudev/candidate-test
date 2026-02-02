import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { StudentService } from '../student/student.service';
import { ChatMessage } from './schemas/chat-message.schema';
import { Conversation } from './schemas/conversation.schema';
import { SendMessageDto } from './dto/send-message.dto';

const STUDENT_ID = '507f1f77bcf86cd799439011';
const CONVERSATION_ID = '507f1f77bcf86cd799439012';

describe('ChatService', () => {
  let service: ChatService;

  const mockFindChain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  };
  const mockChatMessageModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue(mockFindChain),
    countDocuments: jest.fn().mockResolvedValue(0),
    findById: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockConversationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockAiService = {
    generateResponse: jest.fn(),
  };

  const mockKnowledgeService = {
    searchSimilar: jest.fn().mockResolvedValue([]),
  };

  const mockStudentService = {
    getContextForChat: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    mockFindChain.lean.mockResolvedValue([]);
    mockChatMessageModel.find.mockReturnValue(mockFindChain);
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
        {
          provide: StudentService,
          useValue: mockStudentService,
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
      expect(mockAiService.generateResponse).toHaveBeenCalledWith('Hello', [], undefined, undefined);
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
    it('should return paginated chat history (page, limit, total)', async () => {
      const convId = new Types.ObjectId();
      mockConversationModel.findOne.mockResolvedValue({
        _id: convId,
        studentId: new Types.ObjectId(STUDENT_ID),
      });
      mockChatMessageModel.countDocuments.mockResolvedValue(25);
      const page2Messages = [
        { _id: new Types.ObjectId(), role: 'user', content: 'msg11', createdAt: new Date(), metadata: null },
        { _id: new Types.ObjectId(), role: 'assistant', content: 'msg12', createdAt: new Date(), metadata: null },
      ];
      mockFindChain.lean.mockResolvedValue(page2Messages);

      const result = await service.getHistory(STUDENT_ID, convId.toString(), 2, 10);

      expect(mockChatMessageModel.countDocuments).toHaveBeenCalledWith({ conversationId: convId });
      expect(mockFindChain.skip).toHaveBeenCalledWith(10); // (page 2 - 1) * 10
      expect(mockFindChain.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        messages: page2Messages.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })),
        total: 25,
        page: 2,
        limit: 10,
      });
    });

    it('should filter by conversationId when provided', async () => {
      const convId = new Types.ObjectId();
      mockConversationModel.findOne.mockResolvedValue({
        _id: convId,
        studentId: new Types.ObjectId(STUDENT_ID),
      });
      mockChatMessageModel.countDocuments.mockResolvedValue(0);
      mockFindChain.lean.mockResolvedValue([]);

      await service.getHistory(STUDENT_ID, convId.toString());

      expect(mockConversationModel.findOne).toHaveBeenCalledWith({
        _id: convId,
        studentId: new Types.ObjectId(STUDENT_ID),
      });
      expect(mockChatMessageModel.find).toHaveBeenCalledWith({ conversationId: convId });
    });

    it('should return messages in chronological order', async () => {
      const convId = new Types.ObjectId();
      mockConversationModel.findOne.mockResolvedValue({
        _id: convId,
        studentId: new Types.ObjectId(STUDENT_ID),
      });
      mockChatMessageModel.countDocuments.mockResolvedValue(2);
      mockFindChain.lean.mockResolvedValue([
        { _id: new Types.ObjectId(), role: 'user', content: 'first', createdAt: new Date('2024-01-01'), metadata: null },
        { _id: new Types.ObjectId(), role: 'assistant', content: 'second', createdAt: new Date('2024-01-02'), metadata: null },
      ]);

      await service.getHistory(STUDENT_ID, convId.toString(), 1, 10);

      expect(mockFindChain.sort).toHaveBeenCalledWith({ createdAt: 1 });
    });
  });

  describe('deleteHistory', () => {
    const convId = new Types.ObjectId(CONVERSATION_ID);
    const conversation = {
      _id: convId,
      studentId: new Types.ObjectId(STUDENT_ID),
      title: 'Test',
      isActive: true,
    };

    it('should delete all messages from conversation', async () => {
      mockConversationModel.findOne.mockResolvedValue(conversation);
      mockChatMessageModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
      mockConversationModel.findByIdAndDelete.mockResolvedValue(conversation);

      await service.deleteHistory(STUDENT_ID, CONVERSATION_ID);

      expect(mockConversationModel.findOne).toHaveBeenCalledWith({
        _id: convId,
        studentId: new Types.ObjectId(STUDENT_ID),
      });
      expect(mockChatMessageModel.deleteMany).toHaveBeenCalledWith({ conversationId: convId });
      expect(mockConversationModel.findByIdAndDelete).toHaveBeenCalledWith(convId);
    });

    it('should clear cache for deleted conversation', async () => {
      mockConversationModel.findOne.mockResolvedValue(conversation);
      mockChatMessageModel.deleteMany.mockResolvedValue({});
      mockConversationModel.findByIdAndDelete.mockResolvedValue(conversation);

      const cache = (service as any).conversationCache as Map<string, unknown>;
      cache.set(CONVERSATION_ID, [{ role: 'user', content: 'cached' }]);
      expect(cache.has(CONVERSATION_ID)).toBe(true);

      await service.deleteHistory(STUDENT_ID, CONVERSATION_ID);

      expect(cache.has(CONVERSATION_ID)).toBe(false);
    });

    it('should throw error if conversation not found', async () => {
      mockConversationModel.findOne.mockResolvedValue(null);

      const promise = service.deleteHistory(STUDENT_ID, CONVERSATION_ID);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow(
        'Conversación no encontrada o no pertenece al estudiante'
      );

      expect(mockChatMessageModel.deleteMany).not.toHaveBeenCalled();
      expect(mockConversationModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('streamResponse', () => {
    it.todo('should stream AI response tokens');
    it.todo('should handle streaming errors');
    it.todo('should complete stream correctly');
  });
});
