import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        userId: true,
        mood: true,
        notes: true,
        date: true,
        createdAt: true,
      },
    });
  }

  async create(userId: string, dto: CreateCheckInDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = this.normalizeDay(dto.date ? new Date(dto.date) : new Date());
    const existing = await this.prisma.checkIn.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) {
      throw new ConflictException('A check-in already exists for this day');
    }

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const streakCount = this.computeStreak(profile, today);

    const [checkIn] = await this.prisma.$transaction([
      this.prisma.checkIn.create({
        data: {
          userId,
          mood: dto.mood,
          notes: dto.notes,
          date: today,
        },
        select: {
          id: true,
          userId: true,
          mood: true,
          notes: true,
          date: true,
          createdAt: true,
        },
      }),
      this.prisma.profile.upsert({
        where: { userId },
        create: { userId, streakCount, lastCheckInAt: today },
        update: { streakCount, lastCheckInAt: today },
      }),
    ]);

    return checkIn;
  }

  private normalizeDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private computeStreak(
    profile: { streakCount: number; lastCheckInAt: Date | null } | null,
    today: Date,
  ): number {
    if (!profile?.lastCheckInAt) {
      return 1;
    }

    const lastDay = this.normalizeDay(profile.lastCheckInAt);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    if (lastDay.getTime() === yesterday.getTime()) {
      return profile.streakCount + 1;
    }

    return 1;
  }
}
