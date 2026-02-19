import { selectChunksForReview } from '../review-selection.service.js';
import type { ReviewEntity } from '../review-repository.interface.js';

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

// ── Tests ──

describe('selectChunksForReview', () => {
  it('should return overdue reviews sorted by most overdue first', () => {
    const veryOld = createReviewFixture({
      id: 'r1',
      chunkId: 'c1',
      lastReviewedAt: new Date('2010-01-01T00:00:00Z'),
      reviewScore: 0,
    });
    const lessOld = createReviewFixture({
      id: 'r2',
      chunkId: 'c2',
      lastReviewedAt: new Date('2024-01-01T00:00:00Z'),
      reviewScore: 0,
    });

    const result = selectChunksForReview([lessOld, veryOld], 10);

    expect(result[0]?.chunkId).toBe('c1');
    expect(result[1]?.chunkId).toBe('c2');
  });

  it('should respect the limit parameter', () => {
    const reviews = [
      createReviewFixture({
        id: 'r1',
        chunkId: 'c1',
        lastReviewedAt: new Date('2020-01-01'),
        reviewScore: 0,
      }),
      createReviewFixture({
        id: 'r2',
        chunkId: 'c2',
        lastReviewedAt: new Date('2020-01-01'),
        reviewScore: 0,
      }),
      createReviewFixture({
        id: 'r3',
        chunkId: 'c3',
        lastReviewedAt: new Date('2020-01-01'),
        reviewScore: 0,
      }),
    ];

    const result = selectChunksForReview(reviews, 2);

    expect(result).toHaveLength(2);
  });

  it('should skip reviews that are not yet due', () => {
    const notDue = createReviewFixture({
      id: 'r1',
      chunkId: 'c1',
      lastReviewedAt: new Date(),
      reviewScore: 0,
    });

    const result = selectChunksForReview([notDue], 10);

    expect(result).toHaveLength(0);
  });

  it('should consider review score in the interval calculation', () => {
    const highScore = createReviewFixture({
      id: 'r1',
      chunkId: 'c1',
      lastReviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewScore: 5,
    });
    const lowScore = createReviewFixture({
      id: 'r2',
      chunkId: 'c2',
      lastReviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewScore: 0,
    });

    const result = selectChunksForReview([highScore, lowScore], 10);

    // With score=5, interval = 1 * 2^5 = 32 days. 5 days < 32, so not overdue.
    // With score=0, interval = 1 * 2^0 = 1 day. 5 days > 1, so overdue.
    expect(result).toHaveLength(1);
    expect(result[0]?.chunkId).toBe('c2');
  });

  it('should return empty array when given empty input', () => {
    const result = selectChunksForReview([], 10);

    expect(result).toEqual([]);
  });
});
