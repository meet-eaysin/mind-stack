import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type { DailyReviewResponse, SuccessResponse } from "@/types/api";

export const reviewApi = {
  getDaily: (): Promise<DailyReviewResponse> =>
    apiClient.get(ENDPOINTS.review.daily, schemas.DailyReviewResponseSchema),

  submitFeedback: (chunkId: string, score: number): Promise<SuccessResponse> =>
    apiClient.post(
      ENDPOINTS.review.feedback,
      { chunkId, score },
      schemas.SuccessResponseSchema,
    ),

  updateScore: (chunkId: string, score: number): Promise<SuccessResponse> =>
    apiClient.post(
      ENDPOINTS.review.score,
      { chunkId, score },
      schemas.SuccessResponseSchema,
    ),
};
