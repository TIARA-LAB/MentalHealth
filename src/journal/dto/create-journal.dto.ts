import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Mood } from '../../generated/prisma/client';

export class CreateJournalDto {
  @ApiProperty({
    example: 'Morning reflections',
    description: 'Journal entry title',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'Today I felt calm and focused...',
    description: 'Journal entry body',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

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
