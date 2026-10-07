import { Injectable, NotFoundException } from '@nestjs/common';
import { OnboardingStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';
import {
  validateNotificationPreferences,
  withPreferenceDefaults,
} from './dto/profile-preferences.dto';
import { computeWellnessScore } from './wellness-score';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingStatus: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            bio: true,
            avatarUrl: true,
            age: true,
            gender: true,
            goals: true,
            streakCount: true,
            lastCheckInAt: true,
            journalStreakCount: true,
            lastJournalAt: true,
            reminderEnabled: true,
            reminderTime: true,
            onboardingStep: true,
            preferences: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const streakCount = user.profile?.streakCount ?? 0;
    const checkIns = await this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { mood: true, date: true },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        bio: user.profile?.bio ?? null,
        avatarUrl: user.profile?.avatarUrl ?? null,
        age: user.profile?.age ?? null,
        gender: user.profile?.gender ?? null,
        goals: user.profile?.goals ?? [],
        streakCount,
        lastCheckInAt: user.profile?.lastCheckInAt ?? null,
        dayStreak: user.profile?.journalStreakCount ?? 0,
        lastJournalAt: user.profile?.lastJournalAt ?? null,
        wellnessScore: computeWellnessScore({ streakCount, checkIns }),
        reminderEnabled: user.profile?.reminderEnabled ?? false,
        reminderTime:
          user.profile?.reminderTime ??
          withPreferenceDefaults(
            user.profile?.preferences as Record<string, unknown> | null,
            null,
          ).reminderTime,
        onboardingStep: user.profile?.onboardingStep ?? 0,
        onboardingCompleted:
          user.onboardingStatus === OnboardingStatus.COMPLETED ||
          user.onboardingStatus === OnboardingStatus.SKIPPED,
        preferences: this.readPreferences(user.profile?.preferences ?? null),
        createdAt: user.profile?.createdAt ?? null,
        updatedAt: user.profile?.updatedAt ?? null,
      },
    };
  }

  async updateSettings(userId: string, dto: UpdateProfileSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.preferences !== undefined) {
      validateNotificationPreferences(dto.preferences);
    }

    const existing = await this.prisma.profile.findUnique({
      where: { userId },
      select: { preferences: true, reminderTime: true },
    });

    // reminderTime is canonical on the profile column; mirror it into
    // preferences when the client only sends the granular preference.
    const incomingPreferences = dto.preferences
      ? (dto.preferences as Prisma.InputJsonValue)
      : undefined;
    const preferenceReminderTime = dto.preferences?.reminderTime;
    const reminderTime =
      dto.reminderTime ??
      (typeof preferenceReminderTime === 'string'
        ? preferenceReminderTime
        : undefined);

    const preferences =
      incomingPreferences !== undefined
        ? {
            ...(existing?.preferences as Record<string, unknown> | null),
            ...dto.preferences,
          }
        : undefined;

    const shared = {
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.age !== undefined && { age: dto.age }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.goals !== undefined && { goals: dto.goals }),
      ...(dto.reminderEnabled !== undefined && {
        reminderEnabled: dto.reminderEnabled,
      }),
      ...(reminderTime !== undefined && { reminderTime }),
      ...(dto.onboardingStep !== undefined && {
        onboardingStep: dto.onboardingStep,
      }),
      ...(preferences !== undefined && {
        preferences: preferences as Prisma.InputJsonValue,
      }),
    };

    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...shared },
      update: shared,
    });

    return this.getProfile(userId);
  }

  private readPreferences(
    preferences: Prisma.JsonValue | null,
  ): ReturnType<typeof withPreferenceDefaults> & Record<string, unknown> {
    const source = (preferences ?? {}) as Record<string, unknown>;

    return {
      ...source,
      ...withPreferenceDefaults(source, null),
    };
  }
}
