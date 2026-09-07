import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Mood } from '../../generated/prisma/client';

export class CheckInRecordDto {
  @ApiResponseProperty({ example: 'uuid' })
  id!: string;

  @ApiResponseProperty({ example: 'uuid' })
  userId!: string;

  @ApiProperty({ enum: Mood, enumName: 'Mood', example: 'THREE' })
  mood!: Mood;

  @ApiResponseProperty({ example: 'Felt productive and calm today' })
  notes!: string | null;

  @ApiResponseProperty({ example: '2026-09-07T00:00:00.000Z' })
  date!: Date;

  @ApiResponseProperty({ example: '2026-09-07T08:00:00.000Z' })
  createdAt!: Date;
}
