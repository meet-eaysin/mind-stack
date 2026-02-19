import { GenerateDailyReviewUseCase } from '../generate-daily-review.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';
import type { QueryRepository } from '../../../query/domain/query-repository.interface.js';

// ── Fixtures ──

function createReviewFixture(
  overrides: Partial<ReviewEntity> = {},
): ReviewEntity {
  return {
    id: 'review-1',
    chunkId: 'chunk-1',
    lastReviewedAt: new Date('2020-01-01T00:00:00Z'),
    reviewScore: 0,
    ...overrides,
  };
}

// ── Fakes ──

class FakeReviewRepository implements ReviewRepository {
  private reviews: ReviewEntity[] = [];

  seed(reviews: ReviewEntity[]): void {
    this.reviews = reviews;
  }

  findByChunkId(chunkId: string): Promise<ReviewEntity | null> {
    return Promise.resolve(
      this.reviews.find((r) => r.chunkId === chunkId) ?? null,
    );
  }

  upsert(chunkId: string, score: number): Promise<ReviewEntity> {
    const existing = this.reviews.find((r) => r.chunkId === chunkId);
    if (existing) {
      existing.reviewScore = score;
      existing.lastReviewedAt = new Date();
      return Promise.resolve(existing);
    }
    const review: ReviewEntity = {
      id: `review-${String(this.reviews.length + 1)}`,
      chunkId,
      lastReviewedAt: new Date(),
      reviewScore: score,
    };
    this.reviews.push(review);
    return Promise.resolve(review);
  }

  findDueForReview(_limit: number): Promise<ReviewEntity[]> {
    return Promise.resolve([]);
  }

  findAll(): Promise<ReviewEntity[]> {
    return Promise.resolve(this.reviews);
  }
}

class FakeQueryRepository implements QueryRepository {
  private chunks: Array<{
    chunkId: string;
    content: string;
    documentTitle: string;
    importanceScore: number | null;
    tags: string[];
    createdAt: Date;
  }> = [];

  seed(
    chunks: Array<{
      chunkId: string;
      content: string;
      documentTitle: string;
      importanceScore: number | null;
      tags: string[];
      createdAt: Date;
    }>,
  ): void {
    this.chunks = chunks;
  }

  findChunksByIds(chunkIds: string[]): Promise<
    Array<{
      chunkId: string;
      content: string;
      documentTitle: string;
      importanceScore: number | null;
      tags: string[];
      createdAt: Date;
    }>
  > {
    return Promise.resolve(
      this.chunks.filter((c) => chunkIds.includes(c.chunkId)),
    );
  }

  findChunksByTags(_tags: string[]): Promise<string[]> {
    return Promise.resolve([]);
  }

  findChunksByDateRange(_from: Date, _to: Date): Promise<string[]> {
    return Promise.resolve([]);
  }
}

// ── Tests ──

describe('GenerateDailyReviewUseCase', () => {
  let useCase: GenerateDailyReviewUseCase;
  let reviewRepository: FakeReviewRepository;
  let queryRepository: FakeQueryRepository;

  beforeEach(() => {
    reviewRepository = new FakeReviewRepository();
    queryRepository = new FakeQueryRepository();
    useCase = new GenerateDailyReviewUseCase(reviewRepository, queryRepository);
  });

  it('should select overdue reviews and return enriched items', async () => {
    const longAgo = new Date('2020-01-01T00:00:00Z');
    reviewRepository.seed([
      createReviewFixture({
        id: 'r1',
        chunkId: 'chunk-1',
        lastReviewedAt: longAgo,
        reviewScore: 0,
      }),
      createReviewFixture({
        id: 'r2',
        chunkId: 'chunk-2',
        lastReviewedAt: longAgo,
        reviewScore: 1,
      }),
    ]);

    queryRepository.seed([
      {
        chunkId: 'chunk-1',
        content: 'Content about TypeScript',
        documentTitle: 'TS Guide',
        importanceScore: 3,
        tags: ['ts'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
      {
        chunkId: 'chunk-2',
        content: 'Content about NestJS',
        documentTitle: 'NestJS Guide',
        importanceScore: 4,
        tags: ['nest'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ]);

    const result = await useCase.execute(5);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const first = result.items[0];
    expect(first).toBeDefined();
    expect(first?.content).toBeDefined();
    expect(first?.documentTitle).toBeDefined();
    expect(first?.reason).toContain('days ago');
  });

  it('should return empty items when no reviews are overdue', async () => {
    reviewRepository.seed([
      createReviewFixture({
        chunkId: 'chunk-1',
        lastReviewedAt: new Date(),
        reviewScore: 0,
      }),
    ]);

    const result = await useCase.execute(5);

    expect(result.items).toHaveLength(0);
  });
});
