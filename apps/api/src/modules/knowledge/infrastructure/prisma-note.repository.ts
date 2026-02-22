import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { NoteEntity } from '../domain/note.entity.js';
import type { AnnotationType } from '@repo/shared-types';

@Injectable()
export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createForDocument(
    documentId: string,
    content: string,
    type?: AnnotationType,
    chunkId?: string,
    _selectedText?: string,
    _metadata?: Record<string, unknown>,
  ): Promise<NoteEntity> {
    const row = await this.prisma.annotation.create({
      data: {
        id: randomUUID(),
        documentId,
        content,
        chunkId: chunkId ?? null,
        type: type ?? 'NOTE',
      },
    });
    return {
      id: row.id,
      documentId: row.documentId,
      chunkId: row.chunkId,
      selectedText: null,
      content: row.content,
      type: row.type as AnnotationType,
      metadata: null,
      createdAt: row.createdAt,
    };
  }

  async update(noteId: string, content: string): Promise<NoteEntity> {
    const row = await this.prisma.annotation.update({
      where: { id: noteId },
      data: { content },
    });
    return {
      id: row.id,
      documentId: row.documentId,
      chunkId: row.chunkId,
      selectedText: null,
      content: row.content,
      type: row.type as AnnotationType,
      metadata: null,
      createdAt: row.createdAt,
    };
  }

  async findManyByDocumentId(documentId: string): Promise<NoteEntity[]> {
    const rows = await this.prisma.annotation.findMany({
      where: { documentId, type: 'NOTE' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId,
      chunkId: row.chunkId,
      selectedText: null,
      content: row.content,
      type: row.type as AnnotationType,
      metadata: null,
      createdAt: row.createdAt,
    }));
  }
}
