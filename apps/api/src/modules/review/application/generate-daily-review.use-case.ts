import type { ReviewRepository } from '../domain/review-repository.interface.js';
import type { DocumentRepository } from '../../ingestion/domain/document-repository.interface.js';
import { selectChunksForReview } from '../domain/review-selection.service.js';
import type { DailyReviewResponse, ReviewItem } from '@repo/shared-types';

export class GenerateDailyReviewUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly documentRepository: DocumentRepository,
  ) {}

  async execute(limit: number = 5): Promise<DailyReviewResponse> {
    const allReviews = await this.reviewRepository.findAll();
    const selected = selectChunksForReview(allReviews, limit);

    // Fetch documents manually
    const documents = await Promise.all(
      selected.map((r) => this.documentRepository.findById(r.documentId)),
    );

    const items: ReviewItem[] = selected.map((review) => {
      const doc = documents.find((d) => d?.id === review.documentId);
      const content = doc?.rawContent ?? '';
      const summary =
        content.length > 200 ? content.substring(0, 200) + '...' : content;

      return {
        documentId: review.documentId,
        content,
        documentTitle: doc?.title ?? '',
        summary,
        reason: `Last reviewed ${Math.floor(
          (Date.now() - review.lastReviewedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        )} days ago. Score: ${review.reviewScore}`,
        lastReviewedAt: review.lastReviewedAt.toISOString(),
      };
    });

    return {
      items,
      date: new Date().toISOString().split('T')[0] ?? '',
    };
  }
}
