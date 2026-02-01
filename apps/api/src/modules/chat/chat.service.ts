import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { AiService } from '../ai/ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { StudentService } from '../student/student.service';
import { SendMessageDto } from './dto/send-message.dto';

interface MessageHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  // Cache de historial de conversaciones en memoria para optimizar
  private conversationCache: Map<string, MessageHistory[]> = new Map();

  constructor(
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    private readonly aiService: AiService,
    private readonly knowledgeService: KnowledgeService,
    private readonly studentService: StudentService
  ) { }

  /**
   * (⏳) PARTIALLY IMPLEMENTED 
   *
   * El candidato debe completar:
   * - Integración con OpenAI para obtener respuesta real ✅
   * - Implementar streaming de la respuesta
   * - Manejo de errores de la API de OpenAI ✅
   * - Integrar RAG en sendMessage: buscar contexto → llamar a generateResponse(..., relevantContext) ✅
   */
  async sendMessage(dto: SendMessageDto) {
    const { studentId, message, conversationId } = dto;

    const conversation =
      (conversationId ? await this.conversationModel.findById(conversationId) : null)
      ?? (await this.createConversation(studentId));

    // Get History
    const history = await this.getConversationHistory(conversation._id.toString());

    // Save user message
    const userMessage = await this.chatMessageModel.create({
      conversationId: conversation._id,
      role: 'user',
      content: message,
    });

    // Search Relevant chunks based on user message
    let relevantContext: string[] = [];
    let chunkSources: { source: string; count: number }[] = [];
    try {
      const searchResults = await this.knowledgeService.searchSimilar(message, {
        limit: 3, // Top 3 relevant chunks
        minScore: 0.5, // Similarity threshold
      });
      relevantContext = searchResults.map((result) => result.content);
      // Group by sourceFile for UI: "(3) react-hooks.pdf, (1) mongodb-fundamentals.pdf" (own addition)
      const bySource = new Map<string, number>();
      for (const r of searchResults) {
        const name = r.sourceFile || 'documento';
        bySource.set(name, (bySource.get(name) ?? 0) + 1);
      }
      chunkSources = Array.from(bySource.entries()).map(([source, count]) => ({ source, count }));
      this.logger.debug(
        `Found ${relevantContext.length} relevant context chunks for RAG (sources: ${chunkSources.map((s) => `${s.source} (${s.count})`).join(', ') || 'none'})`
      );
    } catch (error) {
      this.logger.warn(`RAG search failed: ${error.message}`);
    }

    let studentContext: { name?: string; currentCourse?: string; progress?: number } | undefined;
    try {
      studentContext = await this.studentService.getContextForChat(studentId);
    } catch (err) {
      this.logger.warn(`Student context for chat failed: ${err?.message}`);
    }

    const aiResponse = await this.aiService.generateResponse(
      message,
      history,
      relevantContext.length > 0 ? relevantContext : undefined,
      studentContext
    );

    const metadata: {
      tokensUsed?: number;
      model?: string;
      chunkSources?: { source: string; count: number }[];
    } = {
      tokensUsed: aiResponse.tokensUsed,
      model: aiResponse.model,
    };
    if (chunkSources.length > 0) {
      metadata.chunkSources = chunkSources;
    }

    // Save assistant message and update conversation
    const [assistantMessage] = await Promise.all([
      this.chatMessageModel.create({
        conversationId: conversation._id,
        role: 'assistant',
        content: aiResponse.content,
        metadata,
      }),
      this.conversationModel.findByIdAndUpdate(conversation._id, {
        lastMessageAt: new Date(),
        $inc: { messageCount: 2 },
      }),
    ]);

    // Update cache for next message
    const historyForNextTime: MessageHistory[] = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse.content },
    ];
    const maxCachedMessages = 20; // same limit as getConversationHistory
    this.conversationCache.set(conversation._id.toString(), historyForNextTime.slice(-maxCachedMessages));

    this.logger.log(`Conversation ${conversation._id} created/updated for student ${studentId}`);
    return {
      conversationId: conversation._id,
      userMessage,
      assistantMessage,
    };
  }

  /**
   * Inicia una nueva conversación para el estudiante
   */
  async startNewConversation(studentId: string, initialContext?: string) {
    const conversation = await this.createConversation(studentId);
    const conversationIdStr = conversation._id.toString();

    // Create new history array not to reuse the reference of the cache of another conversation  Before it was history.length = 0, it was mutating the cache of the previous conversation (bug).
    const history: MessageHistory[] = [];

    if (initialContext) {
      history.push({
        role: 'system',
        content: initialContext,
      });
    }

    this.conversationCache.set(conversationIdStr, history);

    // Marcar conversaciones anteriores como inactivas
    await this.conversationModel.updateMany(
      { studentId: new Types.ObjectId(studentId), _id: { $ne: conversation._id } },
      { isActive: false }
    );

    this.logger.log(`Nueva conversación iniciada: ${conversationIdStr}`);

    return conversation;
  }

  // Return list of conversations of a student (without messages).
  private async getConversations(studentId: string) {
    const conversations = await this.conversationModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ lastMessageAt: -1 })
      .select('title lastMessageAt messageCount isActive')
      .lean();
    return {
      conversations: conversations.map(({ _id, ...rest }) => ({
        id: _id.toString(),
        ...rest,
      })),
    };
  }

  // Paginated messages. If fromEnd=true, page 1 = last N messages (always up to limit), page 2 = next N older messages.
  private async getChatHistory(
    studentId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 10,
    fromEnd: boolean = false
  ) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const conversation = await this.conversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      studentId: new Types.ObjectId(studentId),
    });
    if (!conversation) {
      return { messages: [], total: 0, page: safePage, limit: safeLimit };
    }

    const total = await this.chatMessageModel.countDocuments({
      conversationId: conversation._id,
    });

    const skip = fromEnd
      ? Math.max(0, total - safePage * safeLimit)
      : (safePage - 1) * safeLimit;
    const messages = await this.chatMessageModel
      .find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(safeLimit)
      .select('role content createdAt metadata')
      .lean();

    return {
      messages: messages.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  // logic splitted in two methods to follow the single responsibility
  async getHistory(
    studentId: string,
    conversationId?: string,
    page?: number,
    limit?: number,
    fromEnd?: boolean
  ) {
    if (!conversationId) {
      return this.getConversations(studentId);
    }
    return this.getChatHistory(
      studentId,
      conversationId,
      page ?? 1,
      limit ?? 10,
      fromEnd ?? false
    );
  }

  /**
   *  Implementar eliminación del historial
   *
   * El candidato debe implementar:
   * - Eliminar todos los mensajes de una conversación
   * - Opcionalmente eliminar la conversación completa
   * - Limpiar el cache en memoria
   */

  async deleteHistory(studentId: string, conversationId: string): Promise<void> {
    const convId = new Types.ObjectId(conversationId);
    const conversation = await this.conversationModel.findOne({
      _id: convId,
      studentId: new Types.ObjectId(studentId),
    });
    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada o no pertenece al estudiante');
    }

    await Promise.all([
      this.chatMessageModel.deleteMany({ conversationId: convId }), // Delete messages of the conversation
      this.conversationModel.findByIdAndDelete(convId), // Delete the conversation
    ]);

    this.conversationCache.delete(conversationId);
    this.logger.log(`Historial eliminado: conversación ${conversationId}`);
  }

  /**
   * 📝 TODO: Implementar streaming de respuestas
   *
   * El candidato debe elegir e implementar SSE o WebSocket.
   */
  async streamResponse(dto: SendMessageDto) {
    // TODO: Implementar
    throw new Error('Not implemented');
  }

  /**
   * Helper para crear una nueva conversación
   */
  private async createConversation(studentId: string) {
    return this.conversationModel.create({
      studentId: new Types.ObjectId(studentId),
      title: 'Nueva conversación',
      isActive: true,
      lastMessageAt: new Date(),
    });
  }

  /**
   * Helper para obtener historial de conversación (para contexto de IA)
   */
  private async getConversationHistory(conversationId: string): Promise<MessageHistory[]> {
    // Primero verificar cache
    if (this.conversationCache.has(conversationId)) {
      return this.conversationCache.get(conversationId)!;
    }

    // Si no está en cache, obtener de la base de datos
    const messages = await this.chatMessageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .limit(20) // Últimos 20 mensajes para contexto
      .lean();

    const history: MessageHistory[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Guardar en cache
    this.conversationCache.set(conversationId, history);

    return history;
  }
}
