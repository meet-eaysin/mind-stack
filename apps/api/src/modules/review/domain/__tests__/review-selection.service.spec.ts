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
    nextReviewDate: new Date('2020-01-01T00:00:00Z'),
    interval: 0,
    easeFactor: 2.5,
    repetitionCount: 0,
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
      nextReviewDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    const lessOld = createReviewFixture({
      id: 'r2',
      documentId: 'd2',
      nextReviewDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    });

    const result = selectChunksForReview(
      [
        { type: 'REVIEWED', review: lessOld },
        { type: 'REVIEWED', review: veryOld },
      ],
      10,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      type: 'REVIEWED',
      review: { documentId: 'd1' },
    });
    expect(result[1]).toMatchObject({
      type: 'REVIEWED',
      review: { documentId: 'd2' },
    });
  });

  it('should respect the limit parameter', () => {
    const reviews = [
      createReviewFixture({
        id: 'r1',
        documentId: 'd1',
        nextReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }),
      createReviewFixture({
        id: 'r2',
        documentId: 'd2',
        nextReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }),
      createReviewFixture({
        id: 'r3',
        documentId: 'd3',
        nextReviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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
      nextReviewDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    });

    const result = selectChunksForReview(
      [{ type: 'REVIEWED', review: notDue }],
      10,
    );

    expect(result).toHaveLength(0);
  });

  it('should prioritize unreviewed items with very high overdue score', () => {
    const overdueReview = createReviewFixture({
      id: 'r1',
      documentId: 'd1',
      nextReviewDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days overdue
    });
    const unreviewed = {
      type: 'UNREVIEWED' as const,
      documentId: 'd2',
      createdAt: new Date(),
    deletedAt: null,
    };

    const result = selectChunksForReview(
      [{ type: 'REVIEWED', review: overdueReview }, unreviewed],
      10,
    );

    expect(result[0]).toEqual(unreviewed);
    expect(result[1]).toMatchObject({
      type: 'REVIEWED',
      review: { documentId: 'd1' },
    });
  });

  it('should return empty array when given empty input', () => {
    const result = selectChunksForReview([], 10);
    expect(result).toEqual([]);
  });
});
