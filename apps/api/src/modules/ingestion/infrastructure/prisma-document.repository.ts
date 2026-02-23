import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
    const values: string[] = Object.values(SOURCE_TYPE);
    return values.includes(value);
  }

  private isIngestionStatus(value: string): value is IngestionStatus {
    const values: string[] = Object.values(INGESTION_STATUS);
    return values.includes(value);
  }

  private isLearningStatus(value: string): value is LearningStatus {
    const values: string[] = Object.values(LEARNING_STATUS);
    return values.includes(value);
  }

  private isDocumentType(value: string): value is DocumentType {
    const values: string[] = Object.values(DOCUMENT_TYPE);
    return values.includes(value);
  }

  private mapToDomain(row: {
    id: string;
    title: string;
    userId: string;
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
    processingError: string | null;
    deletedAt: Date | null;
  }): DocumentEntity {
    if (!this.isSourceType(row.sourceType)) {
      throw new Error(`Invalid source type in database: ${row.sourceType}`);
    }
    if (!this.isIngestionStatus(row.status)) {
      throw new Error(`Invalid ingestion status in database: ${row.status}`);
    }
    if (!this.isLearningStatus(row.learningStatus)) {
      throw new Error(
        `Invalid learning status in database: ${row.learningStatus}`,
      );
    }
    if (!this.isDocumentType(row.type)) {
      throw new Error(`Invalid document type in database: ${row.type}`);
    }

    return {
      id: row.id,
      title: row.title,
      userId: row.userId,
      sourceType: row.sourceType,
      sourceUrl: row.sourceUrl,
      rawContent: row.rawContent,
      status: row.status,
      learningStatus: row.learningStatus,
      type: row.type,
      author: row.author,
      publisher: row.publisher,
      publishedAt: row.publishedAt,
      language: row.language,
      addedByUserAt: row.addedByUserAt,
      createdAt: row.createdAt,
      processingError: row.processingError,
      deletedAt: row.deletedAt,
    };
  }

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    const row = await this.prisma.document.upsert({
      where: { id: document.id },
      create: {
        id: document.id,
        title: document.title,
        userId: document.userId,
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
        processingError: document.processingError,
        deletedAt: document.deletedAt ?? null,
      },
      update: {
        title: document.title,
        rawContent: document.rawContent,
        sourceUrl: document.sourceUrl,
        status: document.status,
        learningStatus: document.learningStatus,
        type: document.type,
        author: document.author,
        publisher: document.publisher,
        publishedAt: document.publishedAt,
        language: document.language,
        processingError: document.processingError,
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

  async findBySourceUrl(
    url: string,
    userId: string,
  ): Promise<DocumentEntity | null> {
    const row = await this.prisma.document.findFirst({
      where: { sourceUrl: url, userId, deletedAt: null },
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

  async updateProcessingError(
    id: string,
    errorMessage: string | null,
  ): Promise<void> {
    await this.prisma.document.update({
      where: { id },
      data: { processingError: errorMessage },
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

  async addStatusHistory(
    documentId: string,
    status: IngestionStatus,
    learningStatus: LearningStatus,
  ): Promise<void> {
    await this.prisma.learningStatusHistory.create({
      data: {
        id: randomUUID(),
        documentId,
        status,
        learningStatus,
      },
    });
  }
}
