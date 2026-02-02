import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeChunk } from './schemas/knowledge-chunk.schema';
import { AiService } from '../ai/ai.service';

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  const mockKnowledgeChunkModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockAiService = {
    createEmbedding: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        {
          provide: getModelToken(KnowledgeChunk.name),
          useValue: mockKnowledgeChunkModel,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

  describe('indexCourseContent', () => {
    it('should index course content into chunks', async () => {
      mockAiService.createEmbedding.mockResolvedValue([0.1, 0.2]);
      mockKnowledgeChunkModel.create.mockResolvedValue({});

      const result = await service.indexCourseContent(
        '507f1f77bcf86cd799439011',
        'First sentence. Second sentence. Third sentence.',
        'test.pdf'
      );

      expect(mockAiService.createEmbedding).toHaveBeenCalled();
      expect(mockKnowledgeChunkModel.create).toHaveBeenCalled();
      expect(result).toEqual({ chunksCreated: expect.any(Number) });
      expect(result.chunksCreated).toBeGreaterThanOrEqual(1);
    });
  });

  describe('searchSimilar', () => {
    it('should search for similar content', async () => {
      mockAiService.createEmbedding.mockResolvedValue([1, 0, 0]);
      mockKnowledgeChunkModel.lean.mockResolvedValue([
        {
          content: 'chunk one',
          courseId: new Types.ObjectId('507f1f77bcf86cd799439011'),
          embedding: [1, 0, 0],
          chunkIndex: 0,
          sourceFile: 'doc.pdf',
        },
      ]);

      const results = await service.searchSimilar('query', { limit: 5 });

      expect(mockAiService.createEmbedding).toHaveBeenCalledWith('query');
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('chunk one');
      expect(results[0].score).toBeCloseTo(1);
    });

    it('should filter search results by courseId', async () => {
      mockAiService.createEmbedding.mockResolvedValue([0, 0, 0]);
      mockKnowledgeChunkModel.lean.mockResolvedValue([]);

      await service.searchSimilar('q', { courseId: '507f1f77bcf86cd799439011', limit: 10 });

      expect(mockKnowledgeChunkModel.find).toHaveBeenCalledWith({
        courseId: expect.any(Types.ObjectId),
      });
    });

    it('should return results sorted by similarity score', async () => {
      mockAiService.createEmbedding.mockResolvedValue([1, 0, 0]);
      mockKnowledgeChunkModel.lean.mockResolvedValue([
        { content: 'low', courseId: new Types.ObjectId(), embedding: [0, 1, 0], chunkIndex: 0, sourceFile: 'a.pdf' },
        { content: 'high', courseId: new Types.ObjectId(), embedding: [1, 0, 0], chunkIndex: 1, sourceFile: 'a.pdf' },
        { content: 'mid', courseId: new Types.ObjectId(), embedding: [0.9, 0.1, 0], chunkIndex: 2, sourceFile: 'a.pdf' },
      ]);

      const results = await service.searchSimilar('q', { limit: 5, minScore: 0 });

      expect(results).toHaveLength(3);
      expect(results[0].content).toBe('high');
      expect(results[1].content).toBe('mid');
      expect(results[2].content).toBe('low');
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      expect(results[1].score).toBeGreaterThanOrEqual(results[2].score);
    });
  });
});
