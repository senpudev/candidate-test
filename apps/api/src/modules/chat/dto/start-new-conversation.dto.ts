import { IsString, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartNewConversationDto {
  @ApiProperty({ description: 'ID del estudiante' })
  @IsMongoId()
  studentId: string;

  @ApiPropertyOptional({ description: 'Contexto inicial opcional para la conversación' })
  @IsOptional()
  @IsString()
  initialContext?: string;
}
