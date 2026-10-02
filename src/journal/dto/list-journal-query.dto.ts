import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListJournalQueryDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Include archived entries in the results',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeArchived?: boolean;

  @ApiPropertyOptional({
    example: 50,
    description: 'Maximum number of records to return (1-200)',
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
