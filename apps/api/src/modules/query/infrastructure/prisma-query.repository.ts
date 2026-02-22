import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  QueryRepository,
  QueryChunkDetail,
} from '../domain/query-repository.interface.js';
import type { DocumentTag, Prisma } from '@prisma/client';

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
            annotations: true,
            Review: { select: { id: true } },
          },
        },
      },
    });

    return chunks.map((c) => {
      const doc = c.document;
      return {
        chunkId: c.id,
        content: c.content,
        documentTitle: doc.title,
        author: doc.author,
        publishedAt: doc.publishedAt,
        sourceUrl: doc.sourceUrl,
        importanceScore: doc.ImportanceScore?.score ?? null,
        tags: doc.DocumentTag.map(
          (t: DocumentTag & { tag: { name: string } }) => t.tag.name,
        ),
        createdAt: c.createdAt,
        hasNote: doc.annotations && doc.annotations.length > 0,
        reviewCount: doc.Review.length,
        documentStatus: doc.learningStatus || doc.status, // Fallback to existing status if older data
        documentId: doc.id,
      };
    });
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

  async findChunksByFilters(filters: {
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
    status?: string;
    collectionId?: string;
    conceptId?: string;
    keyword?: string;
  }): Promise<string[]> {
    const where: Prisma.ChunkWhereInput = {};

    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    if (
      filters.tags?.length ||
      filters.status ||
      filters.collectionId ||
      filters.conceptId ||
      filters.keyword
    ) {
      where.document = {};

      if (filters.tags?.length) {
        where.document.DocumentTag = {
          some: { tag: { name: { in: filters.tags } } },
        };
      }

      if (filters.status) {
        where.document.learningStatus = filters.status;
      }

      if (filters.collectionId) {
        where.document.collectionItems = {
          some: { collectionId: filters.collectionId },
        };
      }
    }

    if (filters.conceptId) {
      where.conceptChunks = {
        some: { conceptId: filters.conceptId },
      };
    }

    if (filters.keyword) {
      where.OR = [
        { content: { contains: filters.keyword, mode: 'insensitive' } },
        {
          document: {
            title: { contains: filters.keyword, mode: 'insensitive' },
          },
        },
      ];
    }

    const rows = await this.prisma.chunk.findMany({
      where,
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
}
