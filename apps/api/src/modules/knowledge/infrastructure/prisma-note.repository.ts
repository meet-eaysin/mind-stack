import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { NoteEntity } from '../domain/note.entity.js';

@Injectable()
export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createForDocument(
    documentId: string,
    content: string,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NoteEntity> {
    const row = await this.prisma.note.create({
      data: {
        id: randomUUID(),
        documentId,
        content,
        chunkId: chunkId ?? null,
        selectedText: selectedText ?? null,
        metadata: (metadata as Prisma.InputJsonValue) ?? null,
      },
    });
    return {
      id: row.id,
      documentId: row.documentId,
      chunkId: row.chunkId,
      selectedText: row.selectedText,
      content: row.content,
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt,
    };
  }

  async update(noteId: string, content: string): Promise<NoteEntity> {
    const row = await this.prisma.note.update({
      where: { id: noteId },
      data: { content },
    });
    return {
      id: row.id,
      documentId: row.documentId,
      chunkId: row.chunkId,
      selectedText: row.selectedText,
      content: row.content,
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt,
    };
  }

  async findManyByDocumentId(documentId: string): Promise<NoteEntity[]> {
    const rows = await this.prisma.note.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      chunkId: row.chunkId,
      selectedText: row.selectedText as string | null,
      content: row.content,
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt,
    }));
  }
}
