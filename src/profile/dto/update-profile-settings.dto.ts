import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsSafeHttpsUrl } from '../../common/validators/is-safe-https-url.validator';
import { IsSafeRecord } from '../../common/validators/is-safe-record.validator';

export const GENDERS = [
  'female',
  'male',
  'non-binary',
  'prefer-not-to-say',
  'other',
] as const;

export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
    description: 'Public https URL of the profile avatar image',
  })
  @IsOptional()
  @IsString()
  @IsSafeHttpsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 28,
    description: 'User age in years',
    minimum: 13,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    enum: GENDERS,
    description: 'User gender',
  })
  @IsOptional()
  @IsIn(GENDERS)
  gender?: (typeof GENDERS)[number];

  @ApiPropertyOptional({
    example: ['Meditate daily', 'Sleep 8 hours'],
    description: 'Wellness goals',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @ArrayMaxSize(10)
  goals?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether reminders are enabled for this user',
  })
  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @ApiPropertyOptional({
    example: '20:00',
    description: 'Reminder delivery time in 24-hour HH:MM format',
  })
  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'reminderTime must be in HH:MM format' })
  reminderTime?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Index of the onboarding step the user has reached',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  onboardingStep?: number;

  @ApiPropertyOptional({
    example: {
      theme: 'dark',
      dailyMoodReminder: true,
      journalReminder: true,
      streakAlerts: true,
      reminderTime: '20:00',
    },
    description:
      'User preferences as a flat object of primitive values (max 2 levels deep). ' +
      'dailyMoodReminder, journalReminder and streakAlerts must be booleans; ' +
      'reminderTime must be a 24-hour HH:MM string.',
  })
  @IsOptional()
  @IsSafeRecord()
  preferences?: Record<string, unknown>;
}
