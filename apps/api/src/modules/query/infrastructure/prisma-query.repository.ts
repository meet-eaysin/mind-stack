import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  QueryRepository,
  QueryChunkDetail,
} from '../domain/query-repository.interface.js';
import type { DocumentTag } from '@prisma/client';

@Injectable()
export class PrismaQueryRepository implements QueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findChunksByIds(chunkIds: string[]): Promise<QueryChunkDetail[]> {
    const chunks = await this.prisma.chunk.findMany({
      where: { id: { in: chunkIds } },
      include: {
        document: {
          include: {
            DocumentTag: { include: { tag: true } },
            ImportanceScore: true,
            Note: true,
            Review: { select: { id: true } },
          },
        },
      },
    });

    return chunks.map((c) => ({
      chunkId: c.id,
      content: c.content,
      documentTitle: c.document.title,
      importanceScore: c.document.ImportanceScore?.score ?? null,
      tags: c.document.DocumentTag.map(
        (t: DocumentTag & { tag: { name: string } }) => t.tag.name,
      ),
      createdAt: c.createdAt,
      hasNote: c.document.Note !== null,
      reviewCount: c.document.Review.length,
    }));
  }

  async findChunksByTags(tags: string[]): Promise<string[]> {
    const rows = await this.prisma.chunk.findMany({
      where: {
        document: {
          DocumentTag: {
            some: { tag: { name: { in: tags } } },
          },
        },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
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
