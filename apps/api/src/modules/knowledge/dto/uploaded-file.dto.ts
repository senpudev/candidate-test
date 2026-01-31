import { ApiPropertyOptional } from '@nestjs/swagger';

/** Shape of the file uploaded via Multer (memoryStorage). Validation in controller: Multer injects it, not body JSON, so class-validator does not apply. */
export class UploadedFileDto {
  @ApiPropertyOptional({ description: 'Contenido del archivo en memoria' })
  buffer?: Buffer;

  @ApiPropertyOptional({ description: 'Nombre original del archivo' })
  originalname?: string;

  @ApiPropertyOptional({ description: 'MIME type del archivo' })
  mimetype?: string;

  @ApiPropertyOptional({ description: 'Tamaño en bytes' })
  size?: number;
}
