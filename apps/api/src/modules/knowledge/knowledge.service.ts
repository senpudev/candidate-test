import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiService } from '../ai/ai.service';
import { KnowledgeChunk, KnowledgeChunkDocument } from './schemas/knowledge-chunk.schema';
import { SearchResult } from '@candidate-test/shared';
@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    @InjectModel(KnowledgeChunk.name) private knowledgeChunkModel: Model<KnowledgeChunkDocument>,
    private readonly aiService: AiService
  ) { }

  /**
   * 📝 TODO: Implementar indexacion de contenido
   *
   * El candidato debe:
   * 1. Recibir el contenido de un curso (texto extraido del PDF)
   * 2. Dividir en chunks usando this.splitIntoChunks() (ya implementado)
   * 3. Crear embedding para cada chunk usando this.aiService.createEmbedding()
   * 4. Guardar cada chunk en MongoDB con su embedding
   *
   * Flujo sugerido:
   * ```typescript
   * const chunks = this.splitIntoChunks(content, 1000);
   * for (const [index, chunkText] of chunks.entries()) {
   *   const embedding = await this.aiService.createEmbedding(chunkText);
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
   * 
   * ✅ IMPLEMENTADO - Procesa texto, lo divide en chunks, crea embeddings y los guarda en MongoDB.
   */
  async indexCourseContent(
    courseId: string,
    content: string,
    sourceFile: string
  ): Promise<{ chunksCreated: number }> {

    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    this.logger.log(`Indexing content for course ${courseId} from file ${sourceFile}`);

    try {
      const chunks = this.splitIntoChunks(content, 1000);
      this.logger.debug(`Content split into ${chunks.length} chunks`);

      // Secuential processing of chunks
      for (const [index, chunkText] of chunks.entries()) {
        const embedding = await this.aiService.createEmbedding(chunkText);

        await this.knowledgeChunkModel.create({
          courseId: new Types.ObjectId(courseId),
          content: chunkText,
          embedding,
          sourceFile,
          chunkIndex: index,
        });

        if ((index + 1) % 10 === 0) {
          this.logger.debug(`Processed ${index + 1}/${chunks.length} chunks`);
        }
      }

      this.logger.log(`Successfully indexed ${chunks.length} chunks for course ${courseId}`);
      return { chunksCreated: chunks.length };
    } catch (error) {
      this.logger.error(
        `Error indexing content for course ${courseId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }


  //  Parse a PDF and return the extracted text.
  async parsePdf(pdfBuffer: Buffer): Promise<string> {
    let pdfParse: (buffer: Buffer) => Promise<{ text: string }>;
    try {
      pdfParse = require('pdf-parse');
    } catch {
      throw new Error('pdf-parse no está instalado. Ejecuta: npm install pdf-parse');
    }

    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData?.text?.trim() ?? '';

    if (!text) {
      throw new Error('No se pudo extraer texto del PDF');
    }

    this.logger.debug(`PDF parsed: ${text.length} characters extracted`);
    return text;
  }

  /**
   * ✅ IMPLEMENTADO - Busca chunks similares usando embeddings y similitud coseno en memoria.
   */
  async searchSimilar(query: string, options?: {
    courseId?: string;
    limit?: number;
    minScore?: number;
  }): Promise<SearchResult[]> {

    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    // Default values
    const { courseId, limit = 5, minScore = 0.7 } = options || {};

    this.logger.debug(`Searching similar content for query: "${query.substring(0, 50)}..."`);

    try {
      // Convert user query to embedding 
      const queryEmbedding = await this.aiService.createEmbedding(query);

      // Load embedded chunks from MongoDB based on courseId (if specified)
      const filter = courseId ? { courseId: new Types.ObjectId(courseId) } : {};
      const chunks = await this.knowledgeChunkModel.find(filter).lean();

      this.logger.debug(`Found ${chunks.length} chunks to compare`);

      // Compare user query embedding against each chunk (cosine similarity)
      const scored = chunks.map((chunk) => ({
        content: chunk.content,
        courseId: chunk.courseId.toString(),
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
        chunkIndex: chunk.chunkIndex,
        sourceFile: chunk.sourceFile,
        metadata: chunk.metadata,
      }));

      // Return results based on minScore (+70% similarity score)
      const results = scored
        .filter((r) => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      this.logger.debug(`Found ${results.length} similar chunks (minScore: ${minScore})`);
      return results;
    } catch (error) {
      this.logger.error(`Error searching similar content: ${error.message}`, error.stack);
      throw error;
    }
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
