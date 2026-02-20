import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../domain/review-repository.interface.js';

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(row: {
    id: string;
    documentId: string;
    lastReviewedAt: Date;
    reviewScore: number;
  }): ReviewEntity {
    return {
      id: row.id,
      documentId: row.documentId,
      lastReviewedAt: row.lastReviewedAt,
      reviewScore: row.reviewScore,
    };
  }

  async findByDocumentId(documentId: string): Promise<ReviewEntity | null> {
    const row = await this.prisma.review.findFirst({
      where: { documentId },
      orderBy: { lastReviewedAt: 'desc' },
    });
    if (!row) return null;
    return this.mapToDomain(row);
  }

  async upsert(documentId: string, score: number): Promise<ReviewEntity> {
    const existing = await this.prisma.review.findFirst({
      where: { documentId },
    });

    if (existing) {
      const row = await this.prisma.review.update({
        where: { id: existing.id },
        data: {
          reviewScore: score,
          lastReviewedAt: new Date(),
        },
      });
      return this.mapToDomain(row);
    }

    const row = await this.prisma.review.create({
      data: {
        id: randomUUID(),
        documentId,
        reviewScore: score,
      },
    });
    return this.mapToDomain(row);
  }

  async findDueForReview(limit: number): Promise<ReviewEntity[]> {
    const rows = await this.prisma.review.findMany({
      orderBy: { lastReviewedAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async findAll(): Promise<ReviewEntity[]> {
    const rows = await this.prisma.review.findMany();
    return rows.map((r) => this.mapToDomain(r));
  }
}
