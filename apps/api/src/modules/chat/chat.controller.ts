import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { StartNewConversationDto } from './dto/start-new-conversation.dto';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  // Send a message to the chat with AI (OpenAI).
  @Post('message')
  @ApiOperation({ summary: 'Enviar mensaje al chat con IA' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado y respuesta generada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  // Start a new conversation.
  @Post('conversation/new')
  @ApiOperation({ summary: 'Iniciar una nueva conversación' })
  @ApiResponse({ status: 201, description: 'Conversación creada' })
  async startNewConversation(@Body() dto: StartNewConversationDto) {
    return this.chatService.startNewConversation(dto.studentId, dto.initialContext);
  }

  // Get the conversations of a student.
  @Get('conversations/:studentId')
  @ApiOperation({ summary: 'Listar conversaciones del estudiante' })
  @ApiParam({ name: 'studentId', description: 'ID del estudiante' })
  @ApiResponse({ status: 200, description: 'Lista de conversaciones con id, title, lastMessageAt, messageCount' })
  async getConversations(@Param('studentId') studentId: string) {
    return this.chatService.getConversations(studentId);
  }

  // Get the messages of a conversation (paginated).
  @Get('conversations/:studentId/:conversationId/messages')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación (paginado)' })
  @ApiParam({ name: 'studentId', description: 'ID del estudiante' })
  @ApiParam({ name: 'conversationId', description: 'ID de la conversación' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Mensajes por página' })
  @ApiQuery({ name: 'fromEnd', required: false, description: 'Si true, página 1 = últimos N mensajes' })
  @ApiResponse({ status: 200, description: 'Mensajes con total, page, limit' })
  async getConversationMessages(
    @Param('studentId') studentId: string,
    @Param('conversationId') conversationId: string,
    @Query() queryDto: GetMessagesQueryDto
  ) {
    return this.chatService.getChatHistory(
      studentId,
      conversationId,
      queryDto.page,
      queryDto.limit,
      queryDto.fromEnd
    );
  }

  // Delete a conversation and its messages.
  @Delete('conversations/:studentId/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar conversación y sus mensajes' })
  @ApiParam({ name: 'studentId', description: 'ID del estudiante' })
  @ApiParam({ name: 'conversationId', description: 'ID de la conversación' })
  @ApiResponse({ status: 204, description: 'Conversación eliminada' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  async deleteHistory(
    @Param('studentId') studentId: string,
    @Param('conversationId') conversationId: string
  ) {
    return this.chatService.deleteHistory(studentId, conversationId);
  }

  /**
   * 📝 TODO: Implementar endpoint de streaming
   *
   * El candidato debe elegir e implementar:
   * - SSE: Usar @Sse() decorator y retornar Observable
   * - WebSocket: Crear un Gateway separado
   *
   * El endpoint debe:
   * - Enviar la respuesta del chat token por token
   * - Manejar errores y timeout
   * - Cerrar la conexión al terminar
   */
  // TODO: Descomentar y completar según la opción elegida
  //
  // Opción SSE:
  // @Sse('stream/:conversationId')
  // @ApiOperation({ summary: 'Stream de respuestas del chat' })
  // streamResponse(@Param('conversationId') conversationId: string) {
  //   return this.chatService.streamResponse(...);
  // }
  //
  // Opción WebSocket: Crear chat.gateway.ts
}
