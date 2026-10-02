import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RevokeSessionsDto {
  @ApiPropertyOptional({
    example: 'uuid',
    description:
      'Session id to keep active while revoking every other session. Omit to revoke all sessions.',
  })
  @IsOptional()
  @IsString()
  keepSessionId?: string;
}
