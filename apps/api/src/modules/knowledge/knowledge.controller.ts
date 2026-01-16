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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  /**
   * 📝 TODO: Implementar endpoint para indexar contenido
   *
   * El candidato debe:
   * 1. Recibir courseId y content (texto del PDF)
   * 2. Llamar al servicio para indexar
   * 3. Retornar estadisticas de chunks creados
   */
  @Post('index')
  @ApiOperation({ summary: 'Indexar contenido de un curso' })
  @ApiResponse({ status: 201, description: 'Contenido indexado exitosamente' })
  async indexContent(
    @Body() body: { courseId: string; content: string; sourceFile?: string }
  ) {
    // TODO: Implementar
    throw new Error('Not implemented');
  }

  /**
   * 📝 TODO: Implementar endpoint de busqueda semantica
   *
   * El candidato debe:
   * 1. Recibir query de busqueda
   * 2. Opcionalmente filtrar por courseId
   * 3. Retornar resultados relevantes
   */
  @Get('search')
  @ApiOperation({ summary: 'Buscar contenido similar' })
  @ApiResponse({ status: 200, description: 'Resultados de busqueda' })
  async search(
    @Query('q') query: string,
    @Query('courseId') courseId?: string,
    @Query('limit') limit?: number
  ) {
    // TODO: Implementar
    throw new Error('Not implemented');
  }

  /**
   * Obtener estadisticas de la base de conocimiento
   */
  @Get('stats')
  @ApiOperation({ summary: 'Estadisticas de la base de conocimiento' })
  async getStats() {
    return this.knowledgeService.getStats();
  }

  /**
   * Eliminar chunks de un curso
   */
  @Delete('course/:courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar conocimiento de un curso' })
  async deleteCourseKnowledge(@Param('courseId') courseId: string) {
    return this.knowledgeService.deleteCourseChunks(courseId);
  }
}
