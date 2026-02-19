import { UpdateReviewScoreUseCase } from '../update-review-score.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';

// ── Fakes ──

class FakeReviewRepository implements ReviewRepository {
  private readonly reviews: Map<string, ReviewEntity> = new Map();

  seed(review: ReviewEntity): void {
    this.reviews.set(review.chunkId, review);
  }

  findByChunkId(chunkId: string): Promise<ReviewEntity | null> {
    return Promise.resolve(this.reviews.get(chunkId) ?? null);
  }

  upsert(chunkId: string, score: number): Promise<ReviewEntity> {
    const existing = this.reviews.get(chunkId);
    if (existing) {
      existing.reviewScore = score;
      existing.lastReviewedAt = new Date();
      return Promise.resolve(existing);
    }
    const review: ReviewEntity = {
      id: `review-new`,
      chunkId,
      lastReviewedAt: new Date(),
      reviewScore: score,
    };
    this.reviews.set(chunkId, review);
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
      chunkId: 'chunk-1',
      lastReviewedAt: new Date('2025-01-01T00:00:00Z'),
      reviewScore: 2,
    });

    await useCase.execute({ chunkId: 'chunk-1', score: 4 });

    const review = await reviewRepository.findByChunkId('chunk-1');
    expect(review?.reviewScore).toBe(4);
  });

  it('should throw when no review exists for the given chunk', async () => {
    await expect(
      useCase.execute({ chunkId: 'nonexistent', score: 3 }),
    ).rejects.toThrow('No review found for chunk: nonexistent');
  });
});
