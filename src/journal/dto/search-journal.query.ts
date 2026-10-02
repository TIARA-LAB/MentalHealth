import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SearchJournalQueryDto {
  @ApiProperty({
    example: 'morning',
    description: 'Search term matched against title and content',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  q!: string;

  @ApiPropertyOptional({
    enum: ['true', 'false'],
    example: 'false',
    description: 'Whether to include archived entries',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  includeArchived?: string;
}
