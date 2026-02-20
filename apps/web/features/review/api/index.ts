import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type { DailyReviewResponse, SuccessResponse } from "@/types";

export const reviewApi = {
  getDaily: (): Promise<DailyReviewResponse> =>
    apiClient.get(ENDPOINTS.REVIEW.DAILY, schemas.DailyReviewResponseSchema),

  submitFeedback: (chunkId: string, score: number): Promise<SuccessResponse> =>
    apiClient.post(
      ENDPOINTS.REVIEW.FEEDBACK,
      { chunkId, score },
      schemas.SuccessResponseSchema,
    ),

  updateScore: (chunkId: string, score: number): Promise<SuccessResponse> =>
    apiClient.post(
      ENDPOINTS.REVIEW.SCORE,
      { chunkId, score },
      schemas.SuccessResponseSchema,
    ),
};
