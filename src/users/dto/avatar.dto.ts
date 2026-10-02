import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsSafeHttpsUrl } from '../../common/validators/is-safe-https-url.validator';

export class AvatarDto {
  @ApiProperty({
    example: 'https://cdn.example.com/avatars/jane.png',
    description: 'Public https URL of the avatar image',
  })
  @IsString()
  @IsSafeHttpsUrl()
  avatarUrl!: string;
}
