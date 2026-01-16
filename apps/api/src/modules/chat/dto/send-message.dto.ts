import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'ID del estudiante' })
  @IsMongoId()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'ID de conversación existente' })
  @IsOptional()
  @IsMongoId()
  conversationId?: string;
}
