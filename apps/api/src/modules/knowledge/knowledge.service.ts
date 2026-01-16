import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { KnowledgeChunk, KnowledgeChunkDocument } from './schemas/knowledge-chunk.schema';

interface SearchResult {
  content: string;
  courseId: string;
  score: number;
  metadata?: {
    pageNumber?: number;
    section?: string;
  };
}

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectModel(KnowledgeChunk.name) private knowledgeChunkModel: Model<KnowledgeChunkDocument>,
    private readonly configService: ConfigService
  ) {}

  /**
   * 📝 TODO: Implementar creacion de embeddings
   *
   * El candidato debe:
   * 1. Usar OpenAI Embeddings API (text-embedding-3-small o text-embedding-3-large)
   * 2. Recibir un texto y retornar el vector de embedding (array de números)
   *
   * Ejemplo de implementación:
   * ```typescript
   * const openai = new OpenAI({ apiKey: this.configService.get('OPENAI_API_KEY') });
   * const response = await openai.embeddings.create({
   *   model: 'text-embedding-3-small',
   *   input: text,
   * });
   * return response.data[0].embedding; // number[]
   * ```
   */
  async createEmbedding(text: string): Promise<number[]> {
    // TODO: Implementar llamada a OpenAI Embeddings API
    throw new Error('Not implemented');
  }

  /**
   * 📝 TODO: Implementar indexacion de contenido
   *
   * El candidato debe:
   * 1. Recibir el contenido de un curso (texto extraido del PDF)
   * 2. Dividir en chunks usando this.splitIntoChunks() (ya implementado)
   * 3. Crear embedding para cada chunk usando this.createEmbedding()
   * 4. Guardar cada chunk en MongoDB con su embedding
   *
   * Flujo sugerido:
   * ```typescript
   * const chunks = this.splitIntoChunks(content, 1000);
   * for (const [index, chunkText] of chunks.entries()) {
   *   const embedding = await this.createEmbedding(chunkText);
   *   await this.knowledgeChunkModel.create({
   *     courseId: new Types.ObjectId(courseId),
   *     content: chunkText,
   *     embedding,
   *     sourceFile,
   *     chunkIndex: index,
   *   });
   * }
   * return { chunksCreated: chunks.length };
   * ```
   */
  async indexCourseContent(
    courseId: string,
    content: string,
    sourceFile: string
  ): Promise<{ chunksCreated: number }> {
    // TODO: Implementar
    throw new Error('Not implemented');
  }

  /**
   * 📝 TODO: Implementar busqueda semantica EN MEMORIA
   *
   * IMPORTANTE: La búsqueda se hace en memoria, NO con MongoDB Atlas Vector Search.
   *
   * El candidato debe:
   * 1. Crear embedding de la query usando this.createEmbedding()
   * 2. Cargar chunks de MongoDB (filtrar por courseId si se especifica)
   * 3. Calcular similitud coseno entre query y cada chunk usando this.cosineSimilarity()
   * 4. Ordenar por score descendente y retornar top K resultados
   *
   * Flujo sugerido:
   * ```typescript
   * const { courseId, limit = 5, minScore = 0.7 } = options || {};
   *
   * // 1. Embedding de la query
   * const queryEmbedding = await this.createEmbedding(query);
   *
   * // 2. Cargar chunks (filtrar por curso si aplica)
   * const filter = courseId ? { courseId: new Types.ObjectId(courseId) } : {};
   * const chunks = await this.knowledgeChunkModel.find(filter).lean();
   *
   * // 3. Calcular similitud con cada chunk
   * const scored = chunks.map(chunk => ({
   *   content: chunk.content,
   *   courseId: chunk.courseId.toString(),
   *   score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
   *   metadata: chunk.metadata,
   * }));
   *
   * // 4. Filtrar por minScore, ordenar y limitar
   * return scored
   *   .filter(r => r.score >= minScore)
   *   .sort((a, b) => b.score - a.score)
   *   .slice(0, limit);
   * ```
   */
  async searchSimilar(query: string, options?: {
    courseId?: string;
    limit?: number;
    minScore?: number;
  }): Promise<SearchResult[]> {
    // TODO: Implementar
    throw new Error('Not implemented');
  }

  /**
   * Helper: Calcular similitud coseno entre dos vectores
   * Este metodo ya esta implementado para ayudar al candidato
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Helper: Dividir texto en chunks
   * El candidato puede usar este metodo o implementar su propia logica
   */
  splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Obtener estadisticas de la base de conocimiento
   */
  async getStats(): Promise<{
    totalChunks: number;
    coursesCovered: number;
  }> {
    const totalChunks = await this.knowledgeChunkModel.countDocuments();
    const coursesCovered = await this.knowledgeChunkModel.distinct('courseId');

    return {
      totalChunks,
      coursesCovered: coursesCovered.length,
    };
  }

  /**
   * Eliminar chunks de un curso
   */
  async deleteCourseChunks(courseId: string): Promise<{ deletedCount: number }> {
    const result = await this.knowledgeChunkModel.deleteMany({
      courseId: new Types.ObjectId(courseId),
    });
    return { deletedCount: result.deletedCount };
  }
}
