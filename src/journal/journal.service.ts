import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { SearchJournalQueryDto } from './dto/search-journal.query';

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 365;

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  private journalSelect = {
    id: true,
    userId: true,
    title: true,
    content: true,
    mood: true,
    tags: true,
    archivedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async findAll(userId: string, includeArchived = false, limit?: number) {
    return this.prisma.journal.findMany({
      where: { userId, ...(includeArchived ? {} : { archivedAt: null }) },
      orderBy: { createdAt: 'desc' },
      select: this.journalSelect,
      take: limit,
    });
  }

  async create(userId: string, dto: CreateJournalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const today = this.normalizeDay(new Date());
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { journalStreakCount: true, lastJournalAt: true },
    });
    const journalStreakCount = this.computeStreak(profile, today);

    try {
      const [entry] = await this.prisma.$transaction([
        this.prisma.journal.create({
          data: {
            userId,
            title: dto.title,
            content: dto.content,
            mood: dto.mood,
            tags: dto.tags ?? [],
          },
          select: this.journalSelect,
        }),
        this.prisma.profile.upsert({
          where: { userId },
          create: { userId, journalStreakCount, lastJournalAt: today },
          update: { journalStreakCount, lastJournalAt: today },
        }),
      ]);

      return entry;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async search(userId: string, dto: SearchJournalQueryDto) {
    return this.prisma.journal.findMany({
      where: {
        userId,
        ...(dto.includeArchived === 'true' ? {} : { archivedAt: null }),
        OR: [
          { title: { contains: dto.q, mode: 'insensitive' } },
          { content: { contains: dto.q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: this.journalSelect,
      take: 100,
    });
  }

  async calendar(userId: string, from?: string, to?: string) {
    const range = this.resolveRange(from, to);
    const entries = await this.prisma.journal.findMany({
      where: {
        userId,
        archivedAt: null,
        createdAt: {
          gte: this.startOfDay(range.from),
          lte: this.endOfDay(range.to),
        },
      },
      select: { createdAt: true },
    });

    const counts = new Map<string, number>();
    for (const entry of entries) {
      const key = entry.createdAt.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  async findOne(userId: string, entryId: string) {
    const entry = await this.prisma.journal.findFirst({
      where: { id: entryId, userId },
      select: this.journalSelect,
    });
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  async update(userId: string, entryId: string, dto: UpdateJournalDto) {
    await this.findOne(userId, entryId);

    const data = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.mood !== undefined ? { mood: dto.mood } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
    };
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    return this.prisma.journal.update({
      where: { id: entryId },
      data,
      select: this.journalSelect,
    });
  }

  async remove(userId: string, entryId: string) {
    await this.findOne(userId, entryId);
    await this.prisma.journal.delete({ where: { id: entryId } });
    await this.recomputeStreak(userId);
    return { message: 'Journal entry deleted successfully' };
  }

  async archive(userId: string, entryId: string) {
    await this.findOne(userId, entryId);
    return this.prisma.journal.update({
      where: { id: entryId },
      data: { archivedAt: new Date() },
      select: this.journalSelect,
    });
  }

  async restore(userId: string, entryId: string) {
    await this.findOne(userId, entryId);
    return this.prisma.journal.update({
      where: { id: entryId },
      data: { archivedAt: null },
      select: this.journalSelect,
    });
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

    return { from: clampedFrom, to: toDate };
  }

  private startOfDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private endOfDay(date: Date): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }

  private normalizeDay(date: Date): Date {
    return this.startOfDay(date);
  }

  private computeStreak(
    profile: { journalStreakCount: number; lastJournalAt: Date | null } | null,
    today: Date,
  ): number {
    if (!profile?.lastJournalAt) {
      return 1;
    }

    const lastDay = this.normalizeDay(profile.lastJournalAt);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    // A second entry on the same day must not reset an in-progress streak.
    if (lastDay.getTime() === today.getTime()) {
      return Math.max(profile.journalStreakCount, 1);
    }

    if (lastDay.getTime() === yesterday.getTime()) {
      return profile.journalStreakCount + 1;
    }

    return 1;
  }

  private async recomputeStreak(userId: string): Promise<void> {
    const entries = await this.prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const days = new Set(entries.map((entry) => this.dayKey(entry.createdAt)));
    const today = this.normalizeDay(new Date());
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    let streak = 0;
    let cursor = days.has(this.dayKey(today)) ? today : yesterday;
    while (days.has(this.dayKey(cursor))) {
      streak += 1;
      cursor = new Date(cursor);
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    await this.prisma.profile.upsert({
      where: { userId },
      create: { userId, journalStreakCount: streak },
      update: { journalStreakCount: streak },
    });
  }

  private dayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
