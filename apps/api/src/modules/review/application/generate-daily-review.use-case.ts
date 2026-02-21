import type { ReviewRepository } from '../domain/review-repository.interface.js';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import type { TagRepository } from '../../knowledge/domain/tag-repository.interface.js';
import {
  selectChunksForReview,
  type ReviewTarget,
} from '../domain/review-selection.service.js';
import type { DailyReviewResponse, ReviewItem } from '@repo/shared-types';

export class GenerateDailyReviewUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async execute(limit: number = 5): Promise<DailyReviewResponse> {
    const allReviews = await this.reviewRepository.findAll();
    const allDocuments = await this.documentRepository.findAll();

    const targets: ReviewTarget[] = allDocuments.map((doc) => {
      const review = allReviews.find((r) => r.documentId === doc.id);
      if (review) {
        return { type: 'REVIEWED', review };
      }
      return {
        type: 'UNREVIEWED',
        documentId: doc.id,
        createdAt: doc.createdAt,
      };
    });

    const selected = selectChunksForReview(targets, limit);

    const items: ReviewItem[] = await Promise.all(
      selected.map(async (target) => {
        const docId =
          target.type === 'REVIEWED'
            ? target.review.documentId
            : target.documentId;
        const doc = allDocuments.find((d) => d.id === docId);
        const tags = await this.tagRepository.findByDocumentId(docId);
        const tagNames = tags.map((t) => t.name);

        const content = doc?.rawContent ?? '';
        const summary =
          content.length > 200 ? content.substring(0, 200) + '...' : content;

        let reason = '';
        let lastReviewDate: string | null = null;

        if (target.type === 'REVIEWED') {
          const daysAgo = Math.floor(
            (Date.now() - target.review.lastReviewedAt.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          reason = `Last reviewed ${daysAgo} days ago. Score: ${target.review.reviewScore}`;
          lastReviewDate = target.review.lastReviewedAt.toISOString();
        } else {
          reason = 'Not yet reviewed. Content is fresh and ready for audit.';
          lastReviewDate = null;
        }

        return {
          documentId: docId,
          content,
          documentTitle: doc?.title ?? '',
          summary,
          reason,
          lastReviewedAt: lastReviewDate,
          tags: tagNames,
        };
      }),
    );

    return {
      items,
      date: new Date().toISOString().split('T')[0] ?? '',
    };
  }
}
