import type { ReviewEntity } from './review-repository.interface.js';

const MIN_INTERVAL_DAYS = 1;
const SCORE_MULTIPLIER = 2;

export type ReviewTarget =
  | { type: 'REVIEWED'; review: ReviewEntity }
  | { type: 'UNREVIEWED'; documentId: string; createdAt: Date };

export function selectChunksForReview(
  targets: ReviewTarget[],
  limit: number,
): ReviewTarget[] {
  const now = Date.now();

  const scoredTargets = targets.map((target) => {
    if (target.type === 'UNREVIEWED') {
      // Unreviewed documents get a base overdue score based on their age
      const ageDays =
        (now - target.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      // We want new unreviewed documents to show up, but maybe not immediately
      // Let's give them a high base "overdue" score to prioritize them
      return { target, overdue: 100 + ageDays };
    }

    const { review } = target;
    const daysSinceReview =
      (now - review.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    const interval =
      MIN_INTERVAL_DAYS * Math.pow(SCORE_MULTIPLIER, review.reviewScore);
    const overdue = daysSinceReview - interval;
    return { target, overdue };
  });

  return scoredTargets
    .filter((s) => s.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, limit)
    .map((s) => s.target);
}
