import type { ReviewRepository } from "../domain/review-repository.interface.js";
import type { QueryRepository } from "../../query/domain/query-repository.interface.js";
import { selectChunksForReview } from "../domain/review-selection.service.js";
import type { DailyReviewResponse, ReviewItem } from "@repo/shared-types";

export class GenerateDailyReviewUseCase {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly queryRepository: QueryRepository
  ) {}

  async execute(limit: number = 5): Promise<DailyReviewResponse> {
    const allReviews = await this.reviewRepository.findAll();
    const selected = selectChunksForReview(allReviews, limit);

    const chunkIds = selected.map((r) => r.chunkId);
    const chunkDetails =
      await this.queryRepository.findChunksByIds(chunkIds);

    const items: ReviewItem[] = selected.map((review) => {
      const detail = chunkDetails.find((d) => d.chunkId === review.chunkId);
      const content = detail?.content ?? "";
      const summary =
        content.length > 200 ? content.substring(0, 200) + "..." : content;

      return {
        chunkId: review.chunkId,
        content,
        documentTitle: detail?.documentTitle ?? "",
        summary,
        reason: `Last reviewed ${Math.floor(
          (Date.now() - review.lastReviewedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        )} days ago. Score: ${review.reviewScore}`,
        lastReviewedAt: review.lastReviewedAt.toISOString(),
      };
    });

    return {
      items,
      date: new Date().toISOString().split("T")[0] ?? "",
    };
  }
}
