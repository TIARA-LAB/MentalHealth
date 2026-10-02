import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyPhoneDto {
  @ApiProperty({ example: '+15551234567', description: 'User phone number' })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'phone must be a valid number' })
  phone!: string;

  @ApiProperty({
    example: '123456',
    description: 'Six-digit OTP sent to phone',
  })
  @IsString()
  @Length(6, 6, { message: 'code must be exactly 6 characters' })
  code!: string;
}
