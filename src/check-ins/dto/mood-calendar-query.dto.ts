import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class MoodCalendarQueryDto {
  @ApiPropertyOptional({
    example: '2026-08-01',
    description:
      'Start of the date range as an ISO date string (defaults to 30 days before `to`)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description:
      'End of the date range as an ISO date string (defaults to today)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
