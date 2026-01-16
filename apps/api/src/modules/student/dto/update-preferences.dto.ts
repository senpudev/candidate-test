import { IsString, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ enum: ['light', 'dark'] })
  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: 'light' | 'dark';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;
}
