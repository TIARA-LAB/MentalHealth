import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator';

export class WellnessGoalsDto {
  @ApiProperty({
    example: ['Meditate daily', 'Sleep 8 hours'],
    description: 'List of wellness goals',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @ArrayMaxSize(20)
  goals!: string[];
}
