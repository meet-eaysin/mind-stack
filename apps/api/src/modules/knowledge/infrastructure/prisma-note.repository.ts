import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Prisma } from '@repo/database';
import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { NoteEntity } from '../domain/note.entity.js';
import { ANNOTATION_TYPE, type AnnotationType } from '@repo/shared-types';

@Injectable()
export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  private isAnnotationType(value: string): value is AnnotationType {
    return Object.values(ANNOTATION_TYPE).includes(value as AnnotationType);
  }

  private mapMetadata(
    metadata: Prisma.JsonValue,
  ): Record<string, unknown> | null {
    if (
      metadata !== null &&
      typeof metadata === 'object' &&
      !Array.isArray(metadata)
    ) {
      return metadata as Record<string, unknown>;
    }
    return null;
  }

  private mapToDomain(row: {
    id: string;
    documentId: string;
    chunkId: string | null;
    selectedText: string | null;
    content: string;
    type: string;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }): NoteEntity {
    const type = row.type;
    if (!this.isAnnotationType(type)) {
      throw new Error(`Invalid annotation type in database: ${type}`);
    }

    return {
      id: row.id,
      documentId: row.documentId,
      chunkId: row.chunkId,
      selectedText: row.selectedText,
      content: row.content,
      type,
      metadata: this.mapMetadata(row.metadata),
      createdAt: row.createdAt,
    };
  }

  async createForDocument(
    documentId: string,
    content: string,
    type?: AnnotationType,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NoteEntity> {
    const row = await this.prisma.annotation.create({
      data: {
        id: randomUUID(),
        documentId,
        content,
        chunkId: chunkId ?? null,
        type: type ?? ANNOTATION_TYPE.NOTE,
        selectedText: selectedText ?? null,
        metadata: metadata
          ? (metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });
    return this.mapToDomain(row);
  }

  async update(noteId: string, content: string): Promise<NoteEntity> {
    const row = await this.prisma.annotation.update({
      where: { id: noteId },
      data: { content },
    });
    return this.mapToDomain(row);
  }

  async findManyByDocumentId(documentId: string): Promise<NoteEntity[]> {
    const rows = await this.prisma.annotation.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.mapToDomain(row));
  }
}
