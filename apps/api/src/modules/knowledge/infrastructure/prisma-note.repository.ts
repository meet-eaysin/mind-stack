import { Injectable } from '@nestjs/common';
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
  ): Promise<NoteEntity> {
    const row = await this.prisma.note.create({
      data: { id: randomUUID(), documentId, content },
    });
    return {
      id: row.id,
      documentId: row.documentId,
      content: row.content,
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
      content: row.content,
      createdAt: row.createdAt,
    };
  }

  async findByDocumentId(documentId: string): Promise<NoteEntity | null> {
    const row = await this.prisma.note.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) return null;
    return {
      id: row.id,
      documentId: row.documentId,
      content: row.content,
      createdAt: row.createdAt,
    };
  }
}
