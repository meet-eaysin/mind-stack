import { selectChunksForReview } from '../review-selection.service.js';
import type { ReviewEntity } from '../review-repository.interface.js';

// ── Fixtures ──

function createReviewFixture(
  overrides: Partial<ReviewEntity> = {},
): ReviewEntity {
  return {
    id: 'review-1',
    documentId: 'doc-1',
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
      documentId: 'd1',
      lastReviewedAt: new Date('2010-01-01T00:00:00Z'),
      reviewScore: 0,
    });
    const lessOld = createReviewFixture({
      id: 'r2',
      documentId: 'd2',
      lastReviewedAt: new Date('2024-01-01T00:00:00Z'),
      reviewScore: 0,
    });

    const result = selectChunksForReview(
      [
        { type: 'REVIEWED', review: lessOld },
        { type: 'REVIEWED', review: veryOld },
      ],
      10,
    );

    if (result[0]?.type === 'REVIEWED') {
      expect(result[0].review.documentId).toBe('d1');
    }
    if (result[1]?.type === 'REVIEWED') {
      expect(result[1].review.documentId).toBe('d2');
    }
  });

  it('should respect the limit parameter', () => {
    const reviews = [
      createReviewFixture({
        id: 'r1',
        documentId: 'd1',
        lastReviewedAt: new Date('2020-01-01'),
        reviewScore: 0,
      }),
      createReviewFixture({
        id: 'r2',
        documentId: 'd2',
        lastReviewedAt: new Date('2020-01-01'),
        reviewScore: 0,
      }),
      createReviewFixture({
        id: 'r3',
        documentId: 'd3',
        lastReviewedAt: new Date('2020-01-01'),
        reviewScore: 0,
      }),
    ];

    const result = selectChunksForReview(
      reviews.map((r) => ({ type: 'REVIEWED', review: r })),
      2,
    );

    expect(result).toHaveLength(2);
  });

  it('should skip reviews that are not yet due', () => {
    const notDue = createReviewFixture({
      id: 'r1',
      documentId: 'd1',
      lastReviewedAt: new Date(),
      reviewScore: 0,
    });

    const result = selectChunksForReview(
      [{ type: 'REVIEWED', review: notDue }],
      10,
    );

    expect(result).toHaveLength(0);
  });

  it('should consider review score in the interval calculation', () => {
    const highScore = createReviewFixture({
      id: 'r1',
      documentId: 'd1',
      lastReviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewScore: 5,
    });
    const lowScore = createReviewFixture({
      id: 'r2',
      documentId: 'd2',
      lastReviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewScore: 0,
    });

    const result = selectChunksForReview(
      [
        { type: 'REVIEWED', review: highScore },
        { type: 'REVIEWED', review: lowScore },
      ],
      10,
    );

    // With score=5, interval = 1 * 2^5 = 32 days. 5 days < 32, so not overdue.
    // With score=0, interval = 1 * 2^0 = 1 day. 5 days > 1, so overdue.
    expect(result).toHaveLength(1);
    if (result[0]?.type === 'REVIEWED') {
      expect(result[0].review.documentId).toBe('d2');
    }
  });

  it('should return empty array when given empty input', () => {
    const result = selectChunksForReview([], 10);

    expect(result).toEqual([]);
  });
});
