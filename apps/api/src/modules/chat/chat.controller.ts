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
   * TODO: Implement history retrieval with pagination
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
   * TODO: Implement history deletion
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
   * TODO: Implement streaming endpoint
   */
}
