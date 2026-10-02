import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export const NOTIFICATION_PREFERENCE_DEFAULTS = {
  dailyMoodReminder: true,
  journalReminder: true,
  streakAlerts: true,
  reminderTime: '20:00',
} as const;

export type NotificationPreferences = {
  dailyMoodReminder: boolean;
  journalReminder: boolean;
  streakAlerts: boolean;
  reminderTime: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class ProfilePreferencesDto {
  @ApiProperty({
    example: true,
    description: 'Send the daily mood check-in reminder',
  })
  dailyMoodReminder!: boolean;

  @ApiProperty({
    example: true,
    description: 'Send the journal writing reminder',
  })
  journalReminder!: boolean;

  @ApiProperty({
    example: true,
    description:
      'Alert the user when a check-in or journal streak is about to break',
  })
  streakAlerts!: boolean;

  @ApiProperty({
    example: '20:00',
    description: 'Reminder delivery time in 24-hour HH:MM format',
  })
  reminderTime!: string;
}

export function withPreferenceDefaults(
  preferences: Record<string, unknown> | null | undefined,
  fallbackTime: string | null,
): NotificationPreferences {
  const source = preferences ?? {};
  const defaults = NOTIFICATION_PREFERENCE_DEFAULTS;

  return {
    dailyMoodReminder: readBoolean(
      source.dailyMoodReminder,
      defaults.dailyMoodReminder,
    ),
    journalReminder: readBoolean(
      source.journalReminder,
      defaults.journalReminder,
    ),
    streakAlerts: readBoolean(source.streakAlerts, defaults.streakAlerts),
    reminderTime:
      typeof source.reminderTime === 'string' &&
      TIME_PATTERN.test(source.reminderTime)
        ? source.reminderTime
        : (fallbackTime ?? defaults.reminderTime),
  };
}

export function validateNotificationPreferences(
  preferences: Record<string, unknown>,
): void {
  for (const key of [
    'dailyMoodReminder',
    'journalReminder',
    'streakAlerts',
  ] as const) {
    const value = preferences[key];
    if (value !== undefined && typeof value !== 'boolean') {
      throw new BadRequestException(`preferences.${key} must be a boolean`);
    }
  }

  const reminderTime = preferences.reminderTime;
  if (
    reminderTime !== undefined &&
    (typeof reminderTime !== 'string' || !TIME_PATTERN.test(reminderTime))
  ) {
    throw new BadRequestException(
      'preferences.reminderTime must be a time in 24-hour HH:MM format',
    );
  }
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
