import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IndexContentDto {
  @ApiProperty({ description: 'ID del curso a indexar' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Contenido del PDF a indexar' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Nombre del archivo fuente' })
  @IsOptional()
  @IsString()
  sourceFile?: string;
}
