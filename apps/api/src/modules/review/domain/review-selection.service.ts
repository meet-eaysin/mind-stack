import type { ReviewEntity } from '@/modules/review/domain/review-repository.interface';

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
      // Unreviewed documents get a high base overdue score to prioritize initial learning
      const ageDays =
        (now - target.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return { target, overdue: 1000 + ageDays };
    }

    const { review } = target;
    const nextDate = review.nextReviewDate.getTime();

    // Overdue is the time since nextReviewDate in days
    // If nextReviewDate is in the future, overdue will be negative
    const overdueDays = (now - nextDate) / (1000 * 60 * 60 * 24);

    return { target, overdue: overdueDays };
  });

  return scoredTargets
    .filter((s) => s.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, limit)
    .map((s) => s.target);
}
