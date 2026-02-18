import type { ReviewEntity } from "./review-repository.interface.js";

const MIN_INTERVAL_DAYS = 1;
const SCORE_MULTIPLIER = 2;

export function selectChunksForReview(
  reviews: ReviewEntity[],
  limit: number
): ReviewEntity[] {
  const now = Date.now();

  const scoredReviews = reviews.map((review) => {
    const daysSinceReview =
      (now - review.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24);
    const interval =
      MIN_INTERVAL_DAYS * Math.pow(SCORE_MULTIPLIER, review.reviewScore);
    const overdue = daysSinceReview - interval;
    return { review, overdue };
  });

  return scoredReviews
    .filter((s) => s.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, limit)
    .map((s) => s.review);
}
