import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import {
  INGESTION_STATUS,
  SOURCE_TYPE,
  type IngestionStatus,
  type SourceType,
} from '@repo/shared-types';

@Injectable()
export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private isSourceType(value: string): value is SourceType {
    return Object.values(SOURCE_TYPE).includes(value as SourceType);
  }

  private isIngestionStatus(value: string): value is IngestionStatus {
    return Object.values(INGESTION_STATUS).includes(value as IngestionStatus);
  }

  private mapToDomain(row: {
    id: string;
    title: string;
    sourceType: string;
    sourceUrl: string | null;
    rawContent: string;
    status: string;
    createdAt: Date;
  }): DocumentEntity {
    if (!this.isSourceType(row.sourceType)) {
      throw new Error(`Invalid source type in database: ${row.sourceType}`);
    }
    if (!this.isIngestionStatus(row.status)) {
      throw new Error(`Invalid ingestion status in database: ${row.status}`);
    }

    return {
      id: row.id,
      title: row.title,
      sourceType: row.sourceType,
      sourceUrl: row.sourceUrl,
      rawContent: row.rawContent,
      status: row.status,
      createdAt: row.createdAt,
    };
  }

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

    return this.mapToDomain(row);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const row = await this.prisma.document.findUnique({ where: { id } });
    if (!row) return null;

    return this.mapToDomain(row);
  }

  async findAll(): Promise<DocumentEntity[]> {
    const rows = await this.prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapToDomain(row));
  }

  async findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    const row = await this.prisma.document.findFirst({
      where: { sourceUrl: url },
    });
    if (!row) return null;

    return this.mapToDomain(row);
  }

  async updateStatus(id: string, status: IngestionStatus): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }

  async updateImportance(id: string, score: number): Promise<void> {
    await this.prisma.importanceScore.upsert({
      where: { documentId: id },
      create: { documentId: id, score },
      update: { score },
    });
  }

  async getImportance(id: string): Promise<number | null> {
    const row = await this.prisma.importanceScore.findUnique({
      where: { documentId: id },
    });
    return row?.score ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id },
    });
  }
}
