import { z } from "zod";
import * as schemas from "../schemas/productivity.schemas";

export type TopicMasteryData = z.infer<typeof schemas.TopicMasteryDataSchema>;
export type LearningGoalListItem = z.infer<
  typeof schemas.LearningGoalListItemSchema
>;
export type LearningGoalDetailResponse = z.infer<
  typeof schemas.LearningGoalDetailResponseSchema
>;
export type LearningGoalItemResponse = z.infer<
  typeof schemas.LearningGoalItemResponseSchema
>;
