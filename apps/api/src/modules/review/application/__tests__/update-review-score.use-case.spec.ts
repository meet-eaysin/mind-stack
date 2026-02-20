import { UpdateReviewScoreUseCase } from '../update-review-score.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';

// ── Fakes ──

class FakeReviewRepository implements ReviewRepository {
  private readonly reviews: Map<string, ReviewEntity> = new Map();

  seed(review: ReviewEntity): void {
    this.reviews.set(review.documentId, review);
  }

  findByDocumentId(documentId: string): Promise<ReviewEntity | null> {
    return Promise.resolve(this.reviews.get(documentId) ?? null);
  }

  upsert(documentId: string, score: number): Promise<ReviewEntity> {
    const existing = this.reviews.get(documentId);
    if (existing) {
      existing.reviewScore = score;
      existing.lastReviewedAt = new Date();
      return Promise.resolve(existing);
    }
    const review: ReviewEntity = {
      id: `review-new`,
      documentId,
      lastReviewedAt: new Date(),
      reviewScore: score,
    };
    this.reviews.set(documentId, review);
    return Promise.resolve(review);
  }

  findDueForReview(_limit: number): Promise<ReviewEntity[]> {
    return Promise.resolve([]);
  }

  findAll(): Promise<ReviewEntity[]> {
    return Promise.resolve([...this.reviews.values()]);
  }
}

// ── Tests ──

describe('UpdateReviewScoreUseCase', () => {
  let useCase: UpdateReviewScoreUseCase;
  let reviewRepository: FakeReviewRepository;

  beforeEach(() => {
    reviewRepository = new FakeReviewRepository();
    useCase = new UpdateReviewScoreUseCase(reviewRepository);
  });

  it('should update the review score for an existing review', async () => {
    reviewRepository.seed({
      id: 'r1',
      documentId: 'doc-1',
      lastReviewedAt: new Date('2025-01-01T00:00:00Z'),
      reviewScore: 2,
    });

    await useCase.execute({ documentId: 'doc-1', score: 4 });

    const review = await reviewRepository.findByDocumentId('doc-1');
    expect(review?.reviewScore).toBe(4);
  });

  it('should throw when no review exists for the given document', async () => {
    await expect(
      useCase.execute({ documentId: 'nonexistent', score: 3 }),
    ).rejects.toThrow('No review found for document: nonexistent');
  });
});
