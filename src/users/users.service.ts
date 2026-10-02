import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PutUserDto } from './dto/put-user.dto';
import { AvatarDto } from './dto/avatar.dto';
import { WellnessGoalsDto } from './dto/wellness-goals.dto';
import { ExportStatus } from '../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newEmail =
      dto.email !== undefined ? dto.email.toLowerCase() : undefined;
    const emailChanged = newEmail !== undefined && newEmail !== user.email;
    if (emailChanged) {
      const existing = await this.prisma.user.findFirst({
        where: { email: newEmail, deletedAt: null },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(emailChanged ? { email: newEmail, emailVerifiedAt: null } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await verify(user.password, dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'New password must be different from the current password',
      );
    }

    const hashed = await hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hashed },
      }),
    ]);

    return { message: 'Password changed successfully' };
  }

  async softDelete(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: 'Account deleted successfully' };
  }

  async replaceMe(userId: string, dto: PutUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newEmail =
      dto.email !== undefined ? dto.email.toLowerCase() : undefined;
    const emailChanged = newEmail !== undefined && newEmail !== user.email;
    if (emailChanged) {
      const existing = await this.prisma.user.findFirst({
        where: { email: newEmail, deletedAt: null },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        ...(emailChanged ? { email: newEmail, emailVerifiedAt: null } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateAvatar(userId: string, dto: AvatarDto) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, avatarUrl: dto.avatarUrl },
      update: { avatarUrl: dto.avatarUrl },
      select: { avatarUrl: true },
    });
    return { avatarUrl: profile.avatarUrl };
  }

  async removeAvatar(userId: string) {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, avatarUrl: null },
      update: { avatarUrl: null },
      select: { avatarUrl: true },
    });
    return { avatarUrl: profile.avatarUrl };
  }

  async getWellnessGoals(userId: string) {
    const goal = await this.prisma.wellnessGoal.findUnique({
      where: { userId },
      select: { id: true, goals: true, updatedAt: true },
    });
    if (!goal) {
      return { goals: null };
    }
    return goal;
  }

  async putWellnessGoals(userId: string, dto: WellnessGoalsDto) {
    return this.prisma.wellnessGoal.upsert({
      where: { userId },
      create: { userId, goals: dto.goals },
      update: { goals: dto.goals },
      select: { id: true, goals: true, updatedAt: true },
    });
  }

  async removeWellnessGoals(userId: string) {
    await this.prisma.wellnessGoal.deleteMany({ where: { userId } });
    return { message: 'Wellness goals removed' };
  }

  async createExport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        timezone: true,
        language: true,
        createdAt: true,
        onboardingStatus: true,
        completedOnboardingAt: true,
        profile: {
          select: {
            bio: true,
            avatarUrl: true,
            streakCount: true,
            preferences: true,
            privacy: true,
          },
        },
        checkIns: {
          select: {
            id: true,
            mood: true,
            intensity: true,
            factors: true,
            emotions: true,
            influencers: true,
            notes: true,
            date: true,
            createdAt: true,
          },
        },
        journals: {
          select: {
            id: true,
            title: true,
            content: true,
            mood: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        wellnessGoal: { select: { goals: true } },
        onboardingAnswer: { select: { answers: true } },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        timezone: user.timezone,
        language: user.language,
        createdAt: user.createdAt,
      },
      profile: user.profile
        ? {
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            streakCount: user.profile.streakCount,
            preferences: user.profile.preferences,
            privacy: user.profile.privacy,
          }
        : null,
      checkIns: user.checkIns,
      journals: user.journals,
      wellnessGoals: user.wellnessGoal?.goals ?? null,
      onboarding: {
        status: user.onboardingStatus,
        completedAt: user.completedOnboardingAt,
        answers: user.onboardingAnswer?.answers ?? null,
      },
    };

    return this.prisma.dataExport.create({
      data: {
        userId,
        status: ExportStatus.READY,
        payload,
        completedAt: new Date(),
      },
      select: { id: true, status: true, requestedAt: true, completedAt: true },
    });
  }

  async getExport(userId: string, exportId: string) {
    const record = await this.prisma.dataExport.findFirst({
      where: { id: exportId, userId },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        completedAt: true,
        payload: true,
      },
    });
    if (!record) {
      throw new NotFoundException('Export not found');
    }
    return record;
  }
}
