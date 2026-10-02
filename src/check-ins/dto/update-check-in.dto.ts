import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Mood } from '../../generated/prisma/client';

export class UpdateCheckInDto {
  @ApiPropertyOptional({
    enum: Mood,
    enumName: 'Mood',
    description: 'How the user is feeling today (1-5)',
    example: Mood.THREE,
  })
  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @ApiPropertyOptional({
    example: 3,
    description: 'How strongly the mood is felt (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  intensity?: number;

  @ApiPropertyOptional({
    example: ['sleep', 'work'],
    description: 'Factors that may influence the mood',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  factors?: string[];

  @ApiPropertyOptional({
    example: ['Grateful', 'Anxious'],
    description: 'Emotions the user tagged the mood with',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @ArrayMaxSize(20)
  emotions?: string[];

  @ApiPropertyOptional({
    example: ['Work', 'Sleep'],
    description: 'Influences the user attributed the mood to',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @ArrayMaxSize(20)
  influencers?: string[];

  @ApiPropertyOptional({
    example: 'Felt productive and calm today',
    description: 'Optional notes about the day',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
