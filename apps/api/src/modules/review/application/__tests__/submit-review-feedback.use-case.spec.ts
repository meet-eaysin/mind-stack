import { SubmitReviewFeedbackUseCase } from '../submit-review-feedback.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';

// ── Fakes ──

type ReviewLogEntry = {
  documentId: string;
  feedback: string;
  chunkId: string | null;
  timestamp: Date;
};

class FakeReviewRepository implements ReviewRepository {
  private readonly reviews: Map<string, ReviewEntity> = new Map();
  private readonly logs: ReviewLogEntry[] = [];

  findByDocumentId(documentId: string): Promise<ReviewEntity | null> {
    for (const review of this.reviews.values()) {
      if (review.documentId === documentId) return Promise.resolve(review);
    }
    return Promise.resolve(null);
  }

  save(review: ReviewEntity): Promise<ReviewEntity> {
    this.reviews.set(review.id, review);
    return Promise.resolve(review);
  }

  findDueForReview(_limit: number): Promise<ReviewEntity[]> {
    return Promise.resolve([]);
  }

  findAll(): Promise<ReviewEntity[]> {
    return Promise.resolve([...this.reviews.values()]);
  }

  async addLog(
    documentId: string,
    feedback: string,
    chunkId?: string,
  ): Promise<void> {
    this.logs.push({
      documentId,
      feedback,
      chunkId: chunkId ?? null,
      timestamp: new Date(),
    });
  }

  getByDocumentId(documentId: string): ReviewEntity | undefined {
    for (const review of this.reviews.values()) {
      if (review.documentId === documentId) return review;
    }
    return undefined;
  }

  getLogsForDocument(documentId: string): ReviewLogEntry[] {
    return this.logs.filter((l) => l.documentId === documentId);
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

  it('should create an initial review with interval 1 for score 3', async () => {
    await useCase.execute({ documentId: 'doc-1', score: 3 });

    const review = reviewRepository.getByDocumentId('doc-1');
    expect(review).toBeDefined();
    expect(review?.reviewScore).toBe(3);
    expect(review?.interval).toBe(1);
    expect(review?.repetitionCount).toBe(1);

    const logs = reviewRepository.getLogsForDocument('doc-1');
    expect(logs).toHaveLength(1);
    const firstLog = logs[0];
    if (!firstLog) throw new Error('Log entry not found');
    expect(firstLog.feedback).toBe('DIFFICULT');
  });

  it('should create an initial review with interval 0 for score 2', async () => {
    await useCase.execute({ documentId: 'doc-1', score: 2 });

    const review = reviewRepository.getByDocumentId('doc-1');
    if (!review) throw new Error('Review not found');
    expect(review.interval).toBe(0);
    expect(review.repetitionCount).toBe(0);
  });

  it('should calculate next interval for second repetition (score 4)', async () => {
    // First repetition
    await useCase.execute({ documentId: 'doc-1', score: 4 });
    // Second repetition
    await useCase.execute({ documentId: 'doc-1', score: 4 });

    const review = reviewRepository.getByDocumentId('doc-1');
    if (!review) throw new Error('Review not found');
    expect(review.interval).toBe(6);
    expect(review.repetitionCount).toBe(2);
  });

  it('should calculate next interval for third repetition using ease factor', async () => {
    // Initial
    await useCase.execute({ documentId: 'doc-1', score: 5 }); // I=1, n=1
    await useCase.execute({ documentId: 'doc-1', score: 5 }); // I=6, n=2

    const reviewAfter2 = reviewRepository.getByDocumentId('doc-1');
    const ef = reviewAfter2?.easeFactor ?? 2.5;

    await useCase.execute({ documentId: 'doc-1', score: 5 }); // I=6*ef, n=3

    const review = reviewRepository.getByDocumentId('doc-1');
    if (!review) throw new Error('Review not found');
    expect(review.interval).toBe(Math.round(6 * ef));
    expect(review.repetitionCount).toBe(3);
  });

  it('should reset interval on incorrect response (score < 3)', async () => {
    // Setup high repetition
    await useCase.execute({ documentId: 'doc-1', score: 5 });
    await useCase.execute({ documentId: 'doc-1', score: 5 });

    // Fail
    await useCase.execute({ documentId: 'doc-1', score: 2 });

    const review = reviewRepository.getByDocumentId('doc-1');
    if (!review) throw new Error('Review not found');
    expect(review.interval).toBe(1);
    expect(review.repetitionCount).toBe(0);
  });

  it('should throw when the score is out of range', async () => {
    await expect(
      useCase.execute({ documentId: 'doc-1', score: -1 }),
    ).rejects.toThrow('Review score must be between 0 and 5');

    await expect(
      useCase.execute({ documentId: 'doc-1', score: 6 }),
    ).rejects.toThrow('Review score must be between 0 and 5');
  });
});
