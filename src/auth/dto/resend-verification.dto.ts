import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ResendVerificationDto {
  @ApiPropertyOptional({
    example: 'jane.doe@example.com',
    description: 'Email to resend the verification code to',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+15551234567',
    description: 'Phone number to resend the verification code to',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
