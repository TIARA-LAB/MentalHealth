import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

export class ProfileDetailsDto {
  @ApiResponseProperty({ example: 'A short bio about me' })
  bio!: string | null;

  @ApiResponseProperty({ example: 'https://example.com/avatar.png' })
  avatarUrl!: string | null;

  @ApiResponseProperty({ example: 3 })
  streakCount!: number;

  @ApiResponseProperty({ example: '2026-09-07T00:00:00.000Z' })
  lastCheckInAt!: Date | null;

  @ApiResponseProperty({
    example: { theme: 'dark', notificationsEnabled: true },
  })
  preferences!: Record<string, unknown> | null;

  @ApiResponseProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiResponseProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class UserProfileDto {
  @ApiResponseProperty({ example: 'uuid' })
  id!: string;

  @ApiResponseProperty({ example: 'jane.doe@example.com' })
  email!: string;

  @ApiResponseProperty({ example: 'Jane Doe' })
  name!: string | null;

  @ApiResponseProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiResponseProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: ProfileDetailsDto })
  profile!: ProfileDetailsDto;
}
