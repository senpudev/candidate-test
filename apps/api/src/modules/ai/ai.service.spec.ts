import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
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
  });

  describe('isConfigured', () => {
    it('should return false when API key is not set', () => {
      mockConfigService.get.mockReturnValue(undefined);
      expect(service.isConfigured()).toBe(false);
    });

    it('should return true when API key is set', () => {
      mockConfigService.get.mockReturnValue('sk-test-key');
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('generateResponse', () => {
    /**
     * ✅ TEST QUE PASA - Verifica respuesta placeholder
     */
    it('should return placeholder response when OpenAI not configured', async () => {
      const result = await service.generateResponse('Hello');

      expect(result).toHaveProperty('content');
      expect(result.content).toContain('PLACEHOLDER');
      expect(result.model).toBe('placeholder');
    });

    /**
     * 📝 TODO: El candidato debe implementar estos tests
     * después de configurar la integración con OpenAI
     */
    it.todo('should call OpenAI API with correct parameters');
    it.todo('should include system prompt in messages');
    it.todo('should include conversation history');
    it.todo('should handle OpenAI API errors');
    it.todo('should respect rate limits');
    it.todo('should return token usage information');
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
