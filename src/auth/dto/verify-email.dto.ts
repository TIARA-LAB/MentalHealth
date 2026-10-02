import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'jane.doe@example.com', description: 'User email' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Six-digit OTP sent to email',
  })
  @IsString()
  @Length(6, 6, { message: 'code must be exactly 6 characters' })
  code!: string;
}
