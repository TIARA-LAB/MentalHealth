import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Mood } from '../../generated/prisma/client';

export class UpdateJournalDto {
  @ApiPropertyOptional({
    example: 'Morning reflections',
    description: 'Journal entry title',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'Today I felt calm and focused...',
    description: 'Journal entry body',
    maxLength: 20000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content?: string;

  @ApiPropertyOptional({
    enum: Mood,
    enumName: 'Mood',
    description: 'Mood tied to the entry (1-5)',
    example: Mood.FOUR,
  })
  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @ApiPropertyOptional({
    example: ['reflection', 'work'],
    description: 'Tags for the entry',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  @ArrayMaxSize(10)
  tags?: string[];
}
