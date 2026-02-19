import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../../prisma/prisma.service.js";
import type {
  ChunkRepository,
  ChunkWithMeta,
} from "../domain/chunk-repository.interface.js";
import type { ChunkEntity } from "../domain/chunk.entity.js";

@Injectable()
export class PrismaChunkRepository implements ChunkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDocumentId(documentId: string): Promise<ChunkWithMeta[]> {
    const rows = await this.prisma.chunk.findMany({
      where: { documentId },
      include: {
        chunkTags: { include: { tag: true } },
        notes: true,
        importanceScore: true,
      },
      orderBy: { startOffset: "asc" },
    });

    return rows.map((row) => ({
      chunk: {
        id: row.id,
        documentId: row.documentId,
        content: row.content,
        startOffset: row.startOffset,
        endOffset: row.endOffset,
        createdAt: row.createdAt,
      },
      tags: row.chunkTags.map((ct) => ct.tag.name),
      note: row.notes[0]?.content ?? null,
      importanceScore: row.importanceScore?.score ?? null,
    }));
  }

  async findById(chunkId: string): Promise<ChunkWithMeta | null> {
    const row = await this.prisma.chunk.findUnique({
      where: { id: chunkId },
      include: {
        chunkTags: { include: { tag: true } },
        notes: true,
        importanceScore: true,
      },
    });

    if (!row) return null;

    return {
      chunk: {
        id: row.id,
        documentId: row.documentId,
        content: row.content,
        startOffset: row.startOffset,
        endOffset: row.endOffset,
        createdAt: row.createdAt,
      },
      tags: row.chunkTags.map((ct) => ct.tag.name),
      note: row.notes[0]?.content ?? null,
      importanceScore: row.importanceScore?.score ?? null,
    };
  }

  async createMany(
    documentId: string,
    chunks: Array<{ content: string; startOffset: number; endOffset: number }>
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

  async updateImportance(chunkId: string, score: number): Promise<void> {
    await this.prisma.importanceScore.upsert({
      where: { chunkId },
      create: { chunkId, score },
      update: { score },
    });
  }
}
