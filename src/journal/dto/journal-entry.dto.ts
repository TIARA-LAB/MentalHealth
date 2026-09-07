import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Mood } from '../../generated/prisma/client';

export class JournalEntryDto {
  @ApiResponseProperty({ example: 'uuid' })
  id!: string;

  @ApiResponseProperty({ example: 'uuid' })
  userId!: string;

  @ApiResponseProperty({ example: 'Morning reflections' })
  title!: string;

  @ApiResponseProperty({ example: 'Today I felt calm and focused...' })
  content!: string;

  @ApiProperty({ enum: Mood, enumName: 'Mood', example: 'FOUR' })
  mood!: Mood | null;

  @ApiResponseProperty({ example: ['reflection', 'work'] })
  tags!: string[];

  @ApiResponseProperty({ example: '2026-09-07T08:00:00.000Z' })
  createdAt!: Date;

  @ApiResponseProperty({ example: '2026-09-07T08:00:00.000Z' })
  updatedAt!: Date;
}
