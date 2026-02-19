import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    const row = await this.prisma.document.create({
      data: {
        id: document.id,
        title: document.title,
        sourceType: document.sourceType,
        sourceUrl: document.sourceUrl,
        rawContent: document.rawContent,
        status: document.status,
      },
    });

    return {
      id: row.id,
      title: row.title,
      sourceType: row.sourceType as DocumentEntity['sourceType'],
      sourceUrl: row.sourceUrl,
      rawContent: row.rawContent,
      status: row.status as DocumentEntity['status'],
      createdAt: row.createdAt,
    };
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const row = await this.prisma.document.findUnique({ where: { id } });
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      sourceType: row.sourceType as DocumentEntity['sourceType'],
      sourceUrl: row.sourceUrl,
      rawContent: row.rawContent,
      status: row.status as DocumentEntity['status'],
      createdAt: row.createdAt,
    };
  }

  async findAll(): Promise<DocumentEntity[]> {
    const rows = await this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      sourceType: row.sourceType as DocumentEntity['sourceType'],
      sourceUrl: row.sourceUrl,
      rawContent: row.rawContent,
      status: row.status as DocumentEntity['status'],
      createdAt: row.createdAt,
    }));
  }

  async updateStatus(id: string, status: IngestionStatus): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }
}
