import { z } from "zod";
import * as schemas from "../schemas/review.schemas";

export type ReviewItem = z.infer<typeof schemas.ReviewItemSchema>;
export type DailyReviewResponse = z.infer<
  typeof schemas.DailyReviewResponseSchema
>;
export type SubmitFeedbackRequest = z.infer<
  typeof schemas.SubmitFeedbackRequestSchema
>;
export type UpdateReviewScoreRequest = z.infer<
  typeof schemas.UpdateReviewScoreRequestSchema
>;
