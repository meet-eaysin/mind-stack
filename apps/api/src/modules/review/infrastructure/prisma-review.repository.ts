import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../../prisma/prisma.service.js";
import type {
  ReviewRepository,
  ReviewEntity,
} from "../domain/review-repository.interface.js";

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByChunkId(chunkId: string): Promise<ReviewEntity | null> {
    const row = await this.prisma.review.findFirst({
      where: { chunkId },
      orderBy: { lastReviewedAt: "desc" },
    });
    if (!row) return null;
    return {
      id: row.id,
      chunkId: row.chunkId,
      lastReviewedAt: row.lastReviewedAt,
      reviewScore: row.reviewScore,
    };
  }

  async upsert(chunkId: string, score: number): Promise<ReviewEntity> {
    const existing = await this.prisma.review.findFirst({
      where: { chunkId },
    });

    if (existing) {
      const row = await this.prisma.review.update({
        where: { id: existing.id },
        data: {
          reviewScore: score,
          lastReviewedAt: new Date(),
        },
      });
      return {
        id: row.id,
        chunkId: row.chunkId,
        lastReviewedAt: row.lastReviewedAt,
        reviewScore: row.reviewScore,
      };
    }

    const row = await this.prisma.review.create({
      data: {
        id: randomUUID(),
        chunkId,
        reviewScore: score,
      },
    });
    return {
      id: row.id,
      chunkId: row.chunkId,
      lastReviewedAt: row.lastReviewedAt,
      reviewScore: row.reviewScore,
    };
  }

  async findDueForReview(limit: number): Promise<ReviewEntity[]> {
    const rows = await this.prisma.review.findMany({
      orderBy: { lastReviewedAt: "asc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      chunkId: r.chunkId,
      lastReviewedAt: r.lastReviewedAt,
      reviewScore: r.reviewScore,
    }));
  }

  async findAll(): Promise<ReviewEntity[]> {
    const rows = await this.prisma.review.findMany();
    return rows.map((r) => ({
      id: r.id,
      chunkId: r.chunkId,
      lastReviewedAt: r.lastReviewedAt,
      reviewScore: r.reviewScore,
    }));
  }
}
