import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Mood, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { UpdateCheckInDto } from './dto/update-check-in.dto';

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 365;

@Injectable()
export class CheckInsService {
  constructor(private prisma: PrismaService) {}

  private checkInSelect = {
    id: true,
    userId: true,
    mood: true,
    intensity: true,
    factors: true,
    emotions: true,
    influencers: true,
    notes: true,
    date: true,
    createdAt: true,
  } as const;

  async findAll(userId: string, limit?: number) {
    return this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: this.checkInSelect,
      take: limit,
    });
  }

  async create(userId: string, dto: CreateCheckInDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = this.parseDay(dto.date);
    const existing = await this.prisma.checkIn.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) {
      throw new ConflictException('A check-in already exists for this day');
    }

    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const streakCount = this.computeStreak(profile, today);

    try {
      const [checkIn] = await this.prisma.$transaction([
        this.prisma.checkIn.create({
          data: {
            userId,
            mood: dto.mood,
            intensity: dto.intensity,
            factors: dto.factors ?? [],
            emotions: dto.emotions ?? [],
            influencers: dto.influencers ?? [],
            notes: dto.notes,
            date: today,
          },
          select: this.checkInSelect,
        }),
        this.prisma.profile.upsert({
          where: { userId },
          create: { userId, streakCount, lastCheckInAt: today },
          update: { streakCount, lastCheckInAt: today },
        }),
      ]);

      return checkIn;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A check-in already exists for this day');
      }
      throw error;
    }
  }

  async findToday(userId: string) {
    const today = this.normalizeDay(new Date());
    const checkIn = await this.prisma.checkIn.findFirst({
      where: { userId, date: today },
      select: this.checkInSelect,
    });
    if (!checkIn) {
      throw new NotFoundException('No check-in for today');
    }
    return checkIn;
  }

  async findLatest(userId: string) {
    const checkIn = await this.prisma.checkIn.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      select: this.checkInSelect,
    });
    if (!checkIn) {
      throw new NotFoundException('No check-in found');
    }
    return checkIn;
  }

  async calendar(userId: string, from?: string, to?: string) {
    const range = this.resolveRange(from, to);
    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        userId,
        date: {
          gte: range.from,
          lte: range.to,
        },
      },
      orderBy: { date: 'asc' },
      select: { mood: true, intensity: true, factors: true, date: true },
    });

    const calendar: Record<
      string,
      { mood: Mood; intensity: number | null; factors: string[] }
    > = {};
    for (const checkIn of checkIns) {
      calendar[checkIn.date.toISOString().slice(0, 10)] = {
        mood: checkIn.mood,
        intensity: checkIn.intensity,
        factors: checkIn.factors,
      };
    }
    return calendar;
  }

  async findOne(userId: string, checkInId: string) {
    const checkIn = await this.prisma.checkIn.findFirst({
      where: { id: checkInId, userId },
      select: this.checkInSelect,
    });
    if (!checkIn) {
      throw new NotFoundException('Check-in not found');
    }
    return checkIn;
  }

  async update(userId: string, checkInId: string, dto: UpdateCheckInDto) {
    await this.findOne(userId, checkInId);

    const data = {
      ...(dto.mood !== undefined ? { mood: dto.mood } : {}),
      ...(dto.intensity !== undefined ? { intensity: dto.intensity } : {}),
      ...(dto.factors !== undefined ? { factors: dto.factors } : {}),
      ...(dto.emotions !== undefined ? { emotions: dto.emotions } : {}),
      ...(dto.influencers !== undefined
        ? { influencers: dto.influencers }
        : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
    };
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return this.prisma.checkIn.update({
      where: { id: checkInId },
      data,
      select: this.checkInSelect,
    });
  }

  async remove(userId: string, checkInId: string) {
    await this.findOne(userId, checkInId);
    await this.prisma.checkIn.delete({ where: { id: checkInId } });
    return { message: 'Check-in deleted successfully' };
  }

  private parseDay(input?: string): Date {
    if (!input) {
      return this.normalizeDay(new Date());
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return new Date(`${input}T00:00:00.000Z`);
    }
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    return this.normalizeDay(parsed);
  }

  private normalizeDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private resolveRange(from?: string, to?: string): { from: Date; to: Date } {
    const toDate = to ? new Date(to) : new Date();
    if (Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid `to` date');
    }
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 29 * DAY_MS);
    if (Number.isNaN(fromDate.getTime())) {
      throw new BadRequestException('Invalid `from` date');
    }
    if (fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException('`from` must be on or before `to`');
    }

    const minFrom = new Date(toDate.getTime() - MAX_RANGE_DAYS * DAY_MS);
    const clampedFrom =
      fromDate.getTime() < minFrom.getTime() ? minFrom : fromDate;

    return {
      from: this.normalizeDay(clampedFrom),
      to: this.normalizeDay(toDate),
    };
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
