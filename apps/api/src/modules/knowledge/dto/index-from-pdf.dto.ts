import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Body part of multipart/form-data for POST /knowledge/index-from-pdf.
 * The file is handled separately via @UploadedFile().
 */
export class IndexFromPdfDto {
  @ApiProperty({ description: 'ID del curso a indexar (lista: GET /knowledge/courses)' })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
