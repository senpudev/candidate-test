import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { AiService } from '../ai/ai.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
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
    private readonly knowledgeService: KnowledgeService
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
    let chunksUsed: number[] = [];
    try {
      const searchResults = await this.knowledgeService.searchSimilar(message, {
        limit: 3, // Top 3 relevant chunks
        minScore: 0.5, // Similarity threshold
      });
      relevantContext = searchResults.map((result) => result.content);
      // Get index chunks used 
      chunksUsed = searchResults
        .map((r) => (typeof r.chunkIndex === 'number' ? r.chunkIndex : undefined))
        .filter((idx): idx is number => idx !== undefined);
      this.logger.debug(
        `Found ${relevantContext.length} relevant context chunks for RAG (chunk indices: ${chunksUsed.join(', ') || 'none'})`
      );
    } catch (error) {
      this.logger.warn(`RAG search failed: ${error.message}`);
    }

    const aiResponse = await this.aiService.generateResponse(
      message,
      history,
      relevantContext.length > 0 ? relevantContext : undefined
    );

    const metadata: { tokensUsed?: number; model?: string; chunksUsed?: number[] } = {
      tokensUsed: aiResponse.tokensUsed,
      model: aiResponse.model,
    };
    if (chunksUsed.length > 0) {
      metadata.chunksUsed = chunksUsed;
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

    // Obtener conversaciones anteriores para reutilizar estructura
    const previousConversations = await this.conversationModel
      .find({ studentId: new Types.ObjectId(studentId), isActive: false })
      .sort({ createdAt: -1 })
      .limit(1);

    let history: MessageHistory[];

    if (previousConversations.length > 0) {
      const prevId = previousConversations[0]._id.toString();
      const cachedHistory = this.conversationCache.get(prevId);
      history = cachedHistory || [];
      history.length = 0;
    } else {
      history = [];
    }

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

  /**
   * 📝 TODO: Implementar obtención del historial de chat
   *
   * El candidato debe implementar:
   * - Paginación del historial (limit/offset)
   * - Ordenar mensajes por fecha (más antiguos primero)
   * - Incluir metadata de cada mensaje
   */
  async getHistory(studentId: string, conversationId?: string) {
    // TODO: Implementar
    throw new Error('Not implemented - El candidato debe implementar este método');
  }

  /**
   * 📝 TODO: Implementar eliminación del historial
   *
   * El candidato debe implementar:
   * - Eliminar todos los mensajes de una conversación
   * - Opcionalmente eliminar la conversación completa
   * - Limpiar el cache en memoria
   */
  async deleteHistory(studentId: string, conversationId: string) {
    // TODO: Implementar
    throw new Error('Not implemented - El candidato debe implementar este método');
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
