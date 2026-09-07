import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileSettingsDto } from './dto/update-profile-settings.dto';

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
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            bio: true,
            avatarUrl: true,
            streakCount: true,
            lastCheckInAt: true,
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: {
        bio: user.profile?.bio ?? null,
        avatarUrl: user.profile?.avatarUrl ?? null,
        streakCount: user.profile?.streakCount ?? 0,
        lastCheckInAt: user.profile?.lastCheckInAt ?? null,
        preferences: user.profile?.preferences ?? null,
        createdAt: user.profile?.createdAt ?? null,
        updatedAt: user.profile?.updatedAt ?? null,
      },
    };
  }

  async updateSettings(userId: string, dto: UpdateProfileSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.preferences !== undefined && {
          preferences: dto.preferences as Prisma.InputJsonValue,
        }),
      },
      update: {
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.preferences !== undefined && {
          preferences: dto.preferences as Prisma.InputJsonValue,
        }),
      },
    });

    return this.getProfile(userId);
  }
}
