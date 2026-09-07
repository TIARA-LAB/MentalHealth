import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileSettingsDto {
  @ApiPropertyOptional({
    example: 'A short bio about me',
    description: 'Short bio displayed on the profile',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    description: 'URL of the profile avatar image',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: { theme: 'dark', notificationsEnabled: true },
    description: 'Arbitrary user preferences as a JSON object',
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
