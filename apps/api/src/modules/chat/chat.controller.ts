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

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * ✅ PARCIALMENTE IMPLEMENTADO - Enviar mensaje al chat
   * La estructura está lista, pero el candidato debe completar la integración con OpenAI
   */
  @Post('message')
  @ApiOperation({ summary: 'Enviar mensaje al chat con IA' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado y respuesta generada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  /**
   * ✅ IMPLEMENTADO - Iniciar nueva conversación
   */
  @Post('conversation/new')
  @ApiOperation({ summary: 'Iniciar una nueva conversación' })
  @ApiResponse({ status: 201, description: 'Conversación creada' })
  async startNewConversation(
    @Body('studentId') studentId: string,
    @Body('initialContext') initialContext?: string
  ) {
    return this.chatService.startNewConversation(studentId, initialContext);
  }

  /**
   * 📝 TODO: Implementar obtención del historial
   *
   * El candidato debe:
   * - Implementar paginación con query params (page, limit)
   * - Filtrar por conversationId si se proporciona
   * - Retornar mensajes ordenados cronológicamente
   */
  @Get('history/:studentId')
  @ApiOperation({ summary: 'Obtener historial de chat del estudiante' })
  @ApiParam({ name: 'studentId', description: 'ID del estudiante' })
  @ApiQuery({ name: 'conversationId', required: false, description: 'ID de conversación específica' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Mensajes por página' })
  @ApiResponse({ status: 200, description: 'Historial de mensajes' })
  async getHistory(
    @Param('studentId') studentId: string,
    @Query('conversationId') conversationId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    // TODO: Pasar parámetros de paginación al servicio
    return this.chatService.getHistory(studentId, conversationId);
  }

  /**
   * 📝 TODO: Implementar eliminación del historial
   *
   * El candidato debe:
   * - Validar que el studentId corresponda a la conversación
   * - Eliminar mensajes y opcionalmente la conversación
   * - Retornar confirmación de eliminación
   */
  @Delete('history/:studentId/:conversationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar historial de una conversación' })
  @ApiParam({ name: 'studentId', description: 'ID del estudiante' })
  @ApiParam({ name: 'conversationId', description: 'ID de la conversación' })
  @ApiResponse({ status: 204, description: 'Historial eliminado' })
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
