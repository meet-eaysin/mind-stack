import { SubmitReviewFeedbackUseCase } from '../submit-review-feedback.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';

// ── Fakes ──

class FakeReviewRepository implements ReviewRepository {
  private readonly reviews: Map<string, ReviewEntity> = new Map();
  private idCounter = 0;

  findByChunkId(chunkId: string): Promise<ReviewEntity | null> {
    for (const review of this.reviews.values()) {
      if (review.chunkId === chunkId) return Promise.resolve(review);
    }
    return Promise.resolve(null);
  }

  upsert(chunkId: string, score: number): Promise<ReviewEntity> {
    for (const review of this.reviews.values()) {
      if (review.chunkId === chunkId) {
        review.reviewScore = score;
        review.lastReviewedAt = new Date();
        return Promise.resolve(review);
      }
    }
    this.idCounter += 1;
    const review: ReviewEntity = {
      id: `review-${String(this.idCounter)}`,
      chunkId,
      lastReviewedAt: new Date(),
      reviewScore: score,
    };
    this.reviews.set(review.id, review);
    return Promise.resolve(review);
  }

  findDueForReview(_limit: number): Promise<ReviewEntity[]> {
    return Promise.resolve([]);
  }

  findAll(): Promise<ReviewEntity[]> {
    return Promise.resolve([...this.reviews.values()]);
  }

  getByChunkId(chunkId: string): ReviewEntity | undefined {
    for (const review of this.reviews.values()) {
      if (review.chunkId === chunkId) return review;
    }
    return undefined;
  }
}

// ── Tests ──

describe('SubmitReviewFeedbackUseCase', () => {
  let useCase: SubmitReviewFeedbackUseCase;
  let reviewRepository: FakeReviewRepository;

  beforeEach(() => {
    reviewRepository = new FakeReviewRepository();
    useCase = new SubmitReviewFeedbackUseCase(reviewRepository);
  });

  it('should upsert a review with the given score', async () => {
    await useCase.execute({ chunkId: 'chunk-1', score: 3 });

    const review = reviewRepository.getByChunkId('chunk-1');
    expect(review).toBeDefined();
    expect(review?.reviewScore).toBe(3);
  });

  it('should throw when the score is below 0', async () => {
    await expect(
      useCase.execute({ chunkId: 'chunk-1', score: -1 }),
    ).rejects.toThrow('Review score must be between 0 and 5');
  });

  it('should throw when the score is above 5', async () => {
    await expect(
      useCase.execute({ chunkId: 'chunk-1', score: 6 }),
    ).rejects.toThrow('Review score must be between 0 and 5');
  });

  it('should accept boundary score of 0', async () => {
    await useCase.execute({ chunkId: 'chunk-1', score: 0 });

    const review = reviewRepository.getByChunkId('chunk-1');
    expect(review?.reviewScore).toBe(0);
  });

  it('should accept boundary score of 5', async () => {
    await useCase.execute({ chunkId: 'chunk-1', score: 5 });

    const review = reviewRepository.getByChunkId('chunk-1');
    expect(review?.reviewScore).toBe(5);
  });
});
