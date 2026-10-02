import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { ProfilePreferencesDto } from './profile-preferences.dto';

export class ProfileDetailsDto {
  @ApiResponseProperty({ example: 'A short bio about me' })
  bio!: string | null;

  @ApiResponseProperty({ example: 'https://example.com/avatar.png' })
  avatarUrl!: string | null;

  @ApiProperty({
    example: 28,
    nullable: true,
    description: 'User age in years',
  })
  age!: number | null;

  @ApiProperty({
    example: 'female',
    nullable: true,
    description: 'User gender',
  })
  gender!: string | null;

  @ApiProperty({
    example: ['Meditate daily', 'Sleep 8 hours'],
    description: 'Wellness goals sourced from the wellness-goals record',
  })
  goals!: string[];

  @ApiResponseProperty({ example: 3 })
  streakCount!: number;

  @ApiResponseProperty({ example: '2026-09-07T00:00:00.000Z' })
  lastCheckInAt!: Date | null;

  @ApiProperty({
    example: 2,
    minimum: 0,
    description: 'Consecutive days with at least one journal entry (dayStreak)',
  })
  dayStreak!: number;

  @ApiProperty({
    example: '2026-09-07T00:00:00.000Z',
    description: 'Day of the most recent journal entry',
  })
  lastJournalAt!: Date | null;

  @ApiProperty({
    example: 72,
    minimum: 0,
    maximum: 100,
    description:
      'Server-computed wellness score from mood, streak and check-in consistency over the last 30 days',
  })
  wellnessScore!: number;

  @ApiResponseProperty({ example: true })
  reminderEnabled!: boolean;

  @ApiProperty({
    example: '20:00',
    description: 'Reminder delivery time in 24-hour HH:MM format',
  })
  reminderTime!: string;

  @ApiProperty({
    example: 2,
    minimum: 0,
    description: 'Index of the onboarding step the user has reached',
  })
  onboardingStep!: number;

  @ApiProperty({
    example: false,
    description:
      'Derived from the user onboarding status (COMPLETED or SKIPPED)',
  })
  onboardingCompleted!: boolean;

  @ApiProperty({
    type: ProfilePreferencesDto,
    example: {
      dailyMoodReminder: true,
      journalReminder: true,
      streakAlerts: true,
      reminderTime: '20:00',
    },
    description:
      'Notification preferences. Unknown keys (e.g. theme) are preserved as-is.',
  })
  preferences!: ProfilePreferencesDto & Record<string, unknown>;

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
