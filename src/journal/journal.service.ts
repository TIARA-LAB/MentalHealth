import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalDto } from './dto/create-journal.dto';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.journal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(userId: string, dto: CreateJournalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.journal.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        mood: dto.mood,
        tags: dto.tags ?? [],
      },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
