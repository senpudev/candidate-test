import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AiService } from './ai.service';

const mockChatCompletionsCreate = jest.fn();

/** 
  AiService creates the client with `new OpenAI()` with a conditional check inside the constructor, not by injection.
  So the module 'openai' must be intercepted with jest.mock
*/

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCompletionsCreate,
      },
    },
  })),
}));

describe('AiService', () => {
  let service: AiService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {}); // Prevent console.error calls during tests.
    mockConfigService.get.mockReturnValue(undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('isConfigured', () => {
    it('should return false when API key is not set', () => {
      mockConfigService.get.mockReturnValue(undefined);
      expect(service.isConfigured()).toBe(false);
    });

    it('should return true when API key is set', () => {
      mockConfigService.get.mockReturnValue('ai-test-key');
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('generateResponse', () => {
    it('should return placeholder response when OpenAI not configured', async () => {
      const result = await service.generateResponse('Hello');

      expect(result).toHaveProperty('content');
      expect(result.model).toBe('placeholder');
      expect(result.content?.length).toBeGreaterThan(0);
    });

    describe('when OpenAI is configured', () => {
      beforeEach(async () => {
        mockConfigService.get.mockReturnValue('ai-test-key');
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            AiService,
            { provide: ConfigService, useValue: mockConfigService },
          ],
        }).compile();
        service = module.get<AiService>(AiService);
      });

      it('should call OpenAI API with correct parameters', async () => {
        mockChatCompletionsCreate.mockResolvedValue({
          choices: [{ message: { content: 'Hello from AI' } }],
          usage: { total_tokens: 5 },
          model: 'gpt-4',
        });

        await service.generateResponse('Hi');

        expect(mockChatCompletionsCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 500,
            messages: expect.any(Array),
          })
        );
      });

      it('should include system prompt in messages', async () => {
        mockChatCompletionsCreate.mockResolvedValue({
          choices: [{ message: { content: 'Ok' } }],
          usage: { total_tokens: 1 },
          model: 'gpt-4',
        });

        await service.generateResponse('Test');

        // Mock saves each call to mockChatCompletionsCreate. lastCall = arguments of the last call (array).
        const createOptions = mockChatCompletionsCreate.mock.lastCall![0];
        const systemMessage = createOptions.messages.find((m: { role: string }) => m.role === 'system');
        expect(systemMessage).toBeDefined();
        expect(systemMessage.content).toContain('asistente educativo');
      });

      it('should enrich system prompt when relevantContext is provided (RAG)', async () => {
        mockChatCompletionsCreate.mockResolvedValue({
          choices: [{ message: { content: 'Ok' } }],
          usage: { total_tokens: 1 },
          model: 'gpt-4',
        });

        await service.generateResponse('Question', [], ['chunk one', 'chunk two']);

        // lastCall = arguments of the last call to the mock. [0] = first argument = options { model, messages, ... } sent to the API.
        const createOptions = mockChatCompletionsCreate.mock.lastCall![0];
        const systemMessage = createOptions.messages.find((m: { role: string }) => m.role === 'system');
        expect(systemMessage?.content).toContain('CONTEXTO RELEVANTE');
        expect(systemMessage?.content).toContain('chunk one');
        expect(systemMessage?.content).toContain('chunk two');
      });

      it('should include conversation history', async () => {
        mockChatCompletionsCreate.mockResolvedValue({
          choices: [{ message: { content: 'Ok' } }],
          usage: { total_tokens: 1 },
          model: 'gpt-4',
        });

        const history = [
          { role: 'user' as const, content: 'First' },
          { role: 'assistant' as const, content: 'Reply' },
        ];
        await service.generateResponse('Second', history);


        const createOptions = mockChatCompletionsCreate.mock.lastCall![0];
        const roles = createOptions.messages.map((m: { role: string }) => m.role);
        expect(roles).toContain('system');
        expect(roles).toContain('user');
        expect(roles).toContain('assistant');
        expect(createOptions.messages.some((m: { content: string }) => m.content === 'First')).toBe(true);
        expect(createOptions.messages.some((m: { content: string }) => m.content === 'Reply')).toBe(true);
      });

      it('should handle OpenAI API errors', async () => {
        mockChatCompletionsCreate.mockRejectedValue(new Error('500 Internal Server Error'));

        const result = await service.generateResponse('Hi');

        expect(result.model).toBe('placeholder');
        expect(result.content?.length).toBeGreaterThan(0);
      });

      it('should return token usage information', async () => {
        mockChatCompletionsCreate.mockResolvedValue({
          choices: [{ message: { content: 'Done' } }],
          usage: { total_tokens: 42 },
          model: 'gpt-4',
        });

        const result = await service.generateResponse('Hello');

        expect(result.tokensUsed).toBe(42);
        expect(result.model).toBe('gpt-4');
      });

      it('should respect rate limits', async () => {
        const rateLimitConfig: Record<string, string | number> = {
          OPENAI_API_KEY: 'ai-test-key',
          OPENAI_RATE_LIMIT_MAX: 2,
          OPENAI_RATE_LIMIT_WINDOW_MS: 60000,
        };
        mockConfigService.get.mockImplementation((key: string) => rateLimitConfig[key]);
        mockChatCompletionsCreate.mockResolvedValue({
          choices: [{ message: { content: 'Ok' } }],
          usage: { total_tokens: 1 },
          model: 'gpt-4',
        });

        await service.generateResponse('First');
        await service.generateResponse('Second');
        const thirdResult = await service.generateResponse('Third');

        expect(mockChatCompletionsCreate).toHaveBeenCalledTimes(2);
        expect(thirdResult.model).toBe('placeholder');
        expect(thirdResult.content).toContain('ultra atareados');
      });
    });
  });

  describe('generateStreamResponse', () => {
    it.todo('should yield tokens one by one');
    it.todo('should handle stream interruption');
    it.todo('should complete stream successfully');
  });

  describe('buildContextualSystemPrompt', () => {
    it.todo('should include student name in prompt');
    it.todo('should include current course if provided');
    it.todo('should include progress percentage');
    it.todo('should maintain base prompt content');
  });
});
