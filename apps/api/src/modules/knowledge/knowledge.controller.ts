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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { IndexContentDto } from './dto/index-content.dto';
import { IndexFromPdfDto } from './dto/index-from-pdf.dto';
import { SearchQueryDto } from './dto/search-query.dto';
import { UploadedFileDto } from './dto/uploaded-file.dto';
import { SearchResult } from '@candidate-test/shared';

@ApiTags('knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) { }

  /**
   * 📝 TODO: Implementar endpoint para indexar contenido
   *
   * El candidato debe:
   * 1. Recibir courseId y content (texto del PDF)
   * 2. Llamar al servicio para indexar
   * 3. Retornar estadisticas de chunks creados
   * 
   * ✅ IMPLEMENTADO
   */
  @Post('index')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Indexar contenido de un curso' })
  @ApiResponse({ status: 201, description: 'Contenido indexado exitosamente' })
  async indexContent(@Body() dto: IndexContentDto) {

    const result = await this.knowledgeService.indexCourseContent(
      dto.courseId,
      dto.content,
      dto.sourceFile || 'unknown'
    );

    return result;
  }

  // Parse PDF and index chunks for a course
  @Post('index-from-pdf')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Indexar curso desde un PDF (parsear e indexar chunks)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo PDF a parsear e indexar',
        },
        courseId: {
          type: 'string',
          description: 'ID del curso a indexar (ObjectId de la colección Course)',
        },
      },
      required: ['file', 'courseId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Chunks indexados correctamente' })
  @ApiResponse({ status: 400, description: 'Archivo inválido o faltan parámetros' })
  async indexFromPdf(
    @UploadedFile() file: UploadedFileDto,
    @Body() bodyDto: IndexFromPdfDto
  ) {

    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('El archivo debe ser un PDF');
    }

    if (!bodyDto.courseId?.trim()) {
      throw new BadRequestException('courseId es requerido');
    }

    if (!file.buffer) {
      throw new BadRequestException('No se pudo leer el archivo en memoria.');
    }

    const sourceFileName = file.originalname || 'uploaded.pdf';

    const text = await this.knowledgeService.parsePdf(file.buffer);
    const result = await this.knowledgeService.indexCourseContent(bodyDto.courseId, text, sourceFileName);

    return {
      ...result,
      fileName: file.originalname,
    };
  }

  /**
   * 📝 TODO: Implementar endpoint de busqueda semantica
   *
   * El candidato debe:
   * 1. Recibir query de busqueda
   * 2. Opcionalmente filtrar por courseId
   * 3. Retornar resultados relevantes
   * 
   * ✅ IMPLEMENTADO
   */
  @Get('search')
  @ApiOperation({ summary: 'Buscar contenido similar' })
  @ApiResponse({ status: 200, description: 'Resultados de busqueda' })
  async search(@Query() queryDto: SearchQueryDto): Promise<{ results: SearchResult[]; count: number }> {
    const results = await this.knowledgeService.searchSimilar(queryDto.q, {
      courseId: queryDto.courseId,
      limit: queryDto.limit,
      minScore: queryDto.minScore,
    });

    return { results, count: results.length };
  }

  /**
   * Obtener estadisticas de la base de conocimiento
   */
  @Get('stats')
  @ApiOperation({ summary: 'Estadisticas de la base de conocimiento' })
  async getStats() {
    return this.knowledgeService.getStats();
  }

  // Delete chunks for a course
  @Delete('course/:courseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar conocimiento de un curso' })
  async deleteCourseKnowledge(@Param('courseId') courseId: string) {
    return this.knowledgeService.deleteCourseChunks(courseId);
  }
}
