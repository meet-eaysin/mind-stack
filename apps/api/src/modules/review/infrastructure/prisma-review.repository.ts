import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  ReviewRepository,
  ReviewEntity,
} from '@/modules/review/domain/review-repository.interface';

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(row: {
    id: string;
    documentId: string;
    lastReviewedAt: Date;
    nextReviewDate: Date;
    interval: number;
    easeFactor: number;
    repetitionCount: number;
    reviewScore: number;
  }): ReviewEntity {
    return {
      id: row.id,
      documentId: row.documentId,
      lastReviewedAt: row.lastReviewedAt,
      nextReviewDate: row.nextReviewDate,
      interval: row.interval,
      easeFactor: row.easeFactor,
      repetitionCount: row.repetitionCount,
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

  async save(review: ReviewEntity): Promise<ReviewEntity> {
    const row = await this.prisma.review.upsert({
      where: { id: review.id },
      create: {
        id: review.id,
        documentId: review.documentId,
        lastReviewedAt: review.lastReviewedAt,
        nextReviewDate: review.nextReviewDate,
        interval: review.interval,
        easeFactor: review.easeFactor,
        repetitionCount: review.repetitionCount,
        reviewScore: review.reviewScore,
      },
      update: {
        lastReviewedAt: review.lastReviewedAt,
        nextReviewDate: review.nextReviewDate,
        interval: review.interval,
        easeFactor: review.easeFactor,
        repetitionCount: review.repetitionCount,
        reviewScore: review.reviewScore,
      },
    });
    return this.mapToDomain(row);
  }

  async findDueForReview(limit: number): Promise<ReviewEntity[]> {
    const rows = await this.prisma.review.findMany({
      where: {
        nextReviewDate: {
          lte: new Date(),
        },
      },
      orderBy: { nextReviewDate: 'asc' },
      take: limit,
    });
    return rows.map((r) => this.mapToDomain(r));
  }

  async findAll(): Promise<ReviewEntity[]> {
    const rows = await this.prisma.review.findMany();
    return rows.map((r) => this.mapToDomain(r));
  }

  async addLog(
    documentId: string,
    feedback: string,
    chunkId?: string,
  ): Promise<void> {
    await this.prisma.reviewLog.create({
      data: {
        documentId,
        feedback,
        chunkId: chunkId || null,
      },
    });
  }
}
