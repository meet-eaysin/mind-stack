import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { ChunkRepository } from '../domain/chunk-repository.interface.js';
import type { ChunkEntity } from '../domain/chunk.entity.js';

@Injectable()
export class PrismaChunkRepository implements ChunkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDocumentId(documentId: string): Promise<ChunkEntity[]> {
    const rows = await this.prisma.chunk.findMany({
      where: { documentId },
      orderBy: { startOffset: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      content: row.content,
      startOffset: row.startOffset,
      endOffset: row.endOffset,
      createdAt: row.createdAt,
    }));
  }

  async findById(chunkId: string): Promise<ChunkEntity | null> {
    const row = await this.prisma.chunk.findUnique({
      where: { id: chunkId },
    });

    if (!row) return null;

    return {
      id: row.id,
      documentId: row.documentId,
      content: row.content,
      startOffset: row.startOffset,
      endOffset: row.endOffset,
      createdAt: row.createdAt,
    };
  }

  async countByDocumentId(documentId: string): Promise<number> {
    return this.prisma.chunk.count({
      where: { documentId },
    });
  }

  async createMany(
    documentId: string,
    chunks: Array<{ content: string; startOffset: number; endOffset: number }>,
  ): Promise<ChunkEntity[]> {
    const created: ChunkEntity[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const chunk of chunks) {
        const row = await tx.chunk.create({
          data: {
            id: randomUUID(),
            documentId,
            content: chunk.content,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
          },
        });
        created.push({
          id: row.id,
          documentId: row.documentId,
          content: row.content,
          startOffset: row.startOffset,
          endOffset: row.endOffset,
          createdAt: row.createdAt,
        });
      }
    });

    return created;
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.prisma.chunk.deleteMany({
      where: { documentId },
    });
  }
}
