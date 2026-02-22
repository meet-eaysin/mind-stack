import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import {
  INGESTION_STATUS,
  LEARNING_STATUS,
  SOURCE_TYPE,
  DOCUMENT_TYPE,
  type IngestionStatus,
  type LearningStatus,
  type SourceType,
  type DocumentType,
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

  private isLearningStatus(value: string): value is LearningStatus {
    return Object.values(LEARNING_STATUS).includes(value as LearningStatus);
  }

  private isDocumentType(value: string): value is DocumentType {
    return Object.values(DOCUMENT_TYPE).includes(value as DocumentType);
  }

  private mapToDomain(row: {
    id: string;
    title: string;
    sourceType: string;
    sourceUrl: string | null;
    rawContent: string;
    status: string;
    learningStatus: string;
    type: string;
    author: string | null;
    publisher: string | null;
    publishedAt: Date | null;
    language: string;
    addedByUserAt: Date;
    createdAt: Date;
    deletedAt: Date | null;
  }): DocumentEntity {
    const {
      sourceType,
      status,
      learningStatus,
      type,
      id,
      title,
      sourceUrl,
      rawContent,
      author,
      publisher,
      publishedAt,
      language,
      addedByUserAt,
      createdAt,
      deletedAt,
    } = row;

    if (!this.isSourceType(sourceType)) {
      throw new Error(`Invalid source type in database: ${sourceType}`);
    }
    if (!this.isIngestionStatus(status)) {
      throw new Error(`Invalid ingestion status in database: ${status}`);
    }
    if (!this.isLearningStatus(learningStatus)) {
      throw new Error(`Invalid learning status in database: ${learningStatus}`);
    }
    if (!this.isDocumentType(type)) {
      throw new Error(`Invalid document type in database: ${type}`);
    }

    return {
      id,
      title,
      sourceType,
      sourceUrl,
      rawContent,
      status,
      learningStatus,
      type,
      author,
      publisher,
      publishedAt,
      language,
      addedByUserAt,
      createdAt,
      deletedAt,
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
        learningStatus: document.learningStatus,
        type: document.type,
        author: document.author,
        publisher: document.publisher,
        publishedAt: document.publishedAt,
        language: document.language,
        addedByUserAt: document.addedByUserAt,
        deletedAt: document.deletedAt ?? null,
      },
    });

    return this.mapToDomain(row);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const row = await this.prisma.document.findUnique({
      where: { id },
    });
    if (!row || row.deletedAt) return null;

    return this.mapToDomain(row);
  }

  async findAll(): Promise<DocumentEntity[]> {
    const rows = await this.prisma.document.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.mapToDomain(row));
  }

  async findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    const row = await this.prisma.document.findFirst({
      where: { sourceUrl: url, deletedAt: null },
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
    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
