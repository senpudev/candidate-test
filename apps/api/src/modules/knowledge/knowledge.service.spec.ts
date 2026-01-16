import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeChunk } from './schemas/knowledge-chunk.schema';

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  const mockKnowledgeChunkModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        {
          provide: getModelToken(KnowledgeChunk.name),
          useValue: mockKnowledgeChunkModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 2, 3];
      expect(service.cosineSimilarity(vec, vec)).toBeCloseTo(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vecA = [1, 0];
      const vecB = [0, 1];
      expect(service.cosineSimilarity(vecA, vecB)).toBeCloseTo(0);
    });

    it('should throw error for vectors of different length', () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2];
      expect(() => service.cosineSimilarity(vecA, vecB)).toThrow();
    });
  });

  describe('splitIntoChunks', () => {
    it('should split text into chunks', () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = service.splitIntoChunks(text, 30);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should not split short text', () => {
      const text = 'Short text.';
      const chunks = service.splitIntoChunks(text, 1000);
      expect(chunks.length).toBe(1);
    });
  });

  /**
   * TODO: El candidato debe implementar estos tests
   */
  it.todo('should create embeddings using OpenAI API');
  it.todo('should index course content into chunks');
  it.todo('should search for similar content');
  it.todo('should filter search results by courseId');
  it.todo('should return results sorted by similarity score');
});
