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
   * 1. Usar OpenAI Embeddings API (text-embedding-3-small)
   * 2. Recibir un texto y retornar el vector de embedding
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
   * 2. Dividir en chunks apropiados (ej: 500-1000 tokens)
   * 3. Crear embeddings para cada chunk
   * 4. Guardar en la base de datos
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
   * 📝 TODO: Implementar busqueda semantica
   *
   * El candidato debe:
   * 1. Crear embedding de la query
   * 2. Buscar chunks similares usando similitud coseno
   * 3. Retornar los top K resultados mas relevantes
   *
   * Nota: Pueden usar busqueda en memoria (iterar todos los chunks)
   * o MongoDB Atlas Vector Search si lo prefieren
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
