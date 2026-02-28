import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { ExportCompleteResponse } from '@repo/shared-types';

@Injectable()
export class ExportFullUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<ExportCompleteResponse> {
    const documents = await this.prisma.document.findMany();
    const tags = await this.prisma.tag.findMany();
    const concepts = await this.prisma.concept.findMany();
    const conceptRelations = await this.prisma.conceptRelation.findMany();
    const collections = await this.prisma.collection.findMany();
    const collectionItems = await this.prisma.collectionItem.findMany();
    const learningGoals = await this.prisma.learningGoal.findMany();
    const learningGoalItems = await this.prisma.learningGoalItem.findMany();
    const reviews = await this.prisma.review.findMany();
    const reviewLogs = await this.prisma.reviewLog.findMany();
    const annotations = await this.prisma.annotation.findMany();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        documents: documents.map((d) => ({
          ...d,
          addedByUserAt: d.addedByUserAt.toISOString(),
          createdAt: d.createdAt.toISOString(),
        })),
        tags: tags.map((t) => ({ ...t })),
        concepts: concepts.map((c) => ({ ...c })),
        conceptRelations: conceptRelations.map((cr) => ({ ...cr })),
        collections: collections.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
        collectionItems: collectionItems.map((ci) => ({ ...ci })),
        learningGoals: learningGoals.map((lg) => ({
          ...lg,
          deadline: lg.deadline?.toISOString() ?? null,
          createdAt: lg.createdAt.toISOString(),
          updatedAt: lg.updatedAt.toISOString(),
        })),
        learningGoalItems: learningGoalItems.map((lgi) => ({ ...lgi })),
        reviews: reviews.map((r) => ({
          ...r,
          lastReviewedAt: r.lastReviewedAt.toISOString(),
          nextReviewDate: r.nextReviewDate.toISOString(),
        })),
        reviewLogs: reviewLogs.map((rl) => ({
          ...rl,
          timestamp: rl.timestamp.toISOString(),
        })),
        annotations: annotations.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    } as ExportCompleteResponse;
  }
}
