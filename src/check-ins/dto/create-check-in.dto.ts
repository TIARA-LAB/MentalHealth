import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Mood } from '../../generated/prisma/client';

export class CreateCheckInDto {
  @ApiProperty({
    enum: Mood,
    enumName: 'Mood',
    description: 'How the user is feeling today (1-5)',
    example: Mood.THREE,
  })
  @IsEnum(Mood)
  mood!: Mood;

  @ApiPropertyOptional({
    example: 'Felt productive and calm today',
    description: 'Optional notes about the day',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: '2026-09-07',
    description:
      'Date of the check-in in ISO format. Defaults to today (UTC). One check-in per day.',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
