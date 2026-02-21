import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "../schemas/review.schemas";
import { SuccessResponseSchema } from "@/schemas/api.schemas";
import type { DailyReviewResponse } from "../types";
import type { SuccessResponse } from "@/types";

export const reviewApi = {
  getDaily: (): Promise<DailyReviewResponse> =>
    apiClient.get(ENDPOINTS.REVIEW.DAILY, schemas.DailyReviewResponseSchema),

  submitFeedback: (
    documentId: string,
    score: number,
  ): Promise<SuccessResponse> =>
    apiClient.post(
      ENDPOINTS.REVIEW.FEEDBACK,
      { documentId, score },
      SuccessResponseSchema,
    ),

  updateScore: (documentId: string, score: number): Promise<SuccessResponse> =>
    apiClient.post(
      ENDPOINTS.REVIEW.SCORE,
      { documentId, score },
      SuccessResponseSchema,
    ),
};
