import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  QueryRepository,
  QueryChunkDetail,
} from '../domain/query-repository.interface.js';

@Injectable()
export class PrismaQueryRepository implements QueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findChunksByIds(chunkIds: string[]): Promise<QueryChunkDetail[]> {
    const chunks = await this.prisma.chunk.findMany({
      where: { id: { in: chunkIds } },
      include: {
        document: { select: { title: true } },
        chunkTags: { include: { tag: true } },
        importanceScore: true,
        notes: { select: { id: true } },
        reviews: { select: { id: true } },
      },
    });

    return chunks.map((c) => ({
      chunkId: c.id,
      content: c.content,
      documentTitle: c.document.title,
      importanceScore: c.importanceScore?.score ?? null,
      tags: c.chunkTags.map((ct) => ct.tag.name),
      createdAt: c.createdAt,
      hasNote: c.notes.length > 0,
      reviewCount: c.reviews.length,
    }));
  }

  async findChunksByTags(tags: string[]): Promise<string[]> {
    const rows = await this.prisma.chunkTag.findMany({
      where: { tag: { name: { in: tags } } },
      select: { chunkId: true },
      distinct: ['chunkId'],
    });
    return rows.map((r) => r.chunkId);
  }

  async findChunksByDateRange(from: Date, to: Date): Promise<string[]> {
    const rows = await this.prisma.chunk.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
