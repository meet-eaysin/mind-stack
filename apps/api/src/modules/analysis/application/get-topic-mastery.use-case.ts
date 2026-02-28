import { Injectable } from '@nestjs/common';
import { type TopicMasteryData } from '@repo/shared-types';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GetTopicMasteryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<TopicMasteryData> {
    const [totalConcepts, reviewedConceptsCount] = await Promise.all([
      this.prisma.concept.count(),
      this.prisma.review.count({
        where: {
          repetitionCount: { gt: 0 },
        },
      }),
    ]);

    const reviews = await this.prisma.review.findMany({
      include: {
        document: {
          include: {
            chunks: {
              include: {
                conceptChunks: {
                  include: {
                    concept: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const levels = {
      mastered: 0,
      consolidating: 0,
      learning: 0,
      unseen: totalConcepts - reviewedConceptsCount,
    };

    reviews.forEach((r) => {
      const repCount = r.repetitionCount ?? 0;
      if (r.interval > 30) levels.mastered++;
      else if (r.interval >= 7) levels.consolidating++;
      else if (repCount > 0) levels.learning++;
    });

    const weakReviews = await this.prisma.review.findMany({
      where: {
        OR: [{ easeFactor: { lt: 2.0 } }, { reviewScore: { lt: 3 } }],
      },
      orderBy: {
        easeFactor: 'asc',
      },
      take: 10,
    });

    // Mapping reviews back to concepts for weak areas is tricky because
    // a review is for a document, and a document can have many concepts.
    // For simplicity, we'll return documents with low ease factors as 'weak documents'.
    // But the requirement says 'Topic Mastery', so let's try to find concepts
    // associated with the most difficult documents.

    const weakAreas = [];
    const seenConceptIds = new Set<string>();

    for (const r of weakReviews) {
      // Find one prominent concept for this document
      const conceptChunk = await this.prisma.conceptChunk.findFirst({
        where: { chunk: { documentId: r.documentId } },
        include: { concept: true },
      });
      if (conceptChunk && !seenConceptIds.has(conceptChunk.concept.id)) {
        const concept = conceptChunk.concept;
        seenConceptIds.add(concept.id);
        weakAreas.push({
          id: concept.id,
          label: concept.label,
          easeFactor: r.easeFactor,
          interval: r.interval,
        });
      }
    }

    const docGroups = await this.prisma.document.groupBy({
      by: ['learningStatus'],
      _count: {
        id: true,
      },
    });

    const distribution: Record<string, number> = {};
    docGroups.forEach((g) => {
      distribution[g.learningStatus] = g._count.id;
    });

    return {
      coverage: {
        totalConcepts,
        reviewedConcepts: reviewedConceptsCount,
        percent:
          totalConcepts > 0 ? (reviewedConceptsCount / totalConcepts) * 100 : 0,
      },
      levels,
      weakAreas,
      learningStatusDistribution: distribution,
    };
  }
}
