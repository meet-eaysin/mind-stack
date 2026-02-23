import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constants/endpoints";
import * as schemas from "../schemas/productivity.schemas";
import { z } from "zod";
import type {
  TopicMasteryData,
  LearningGoalListItem,
  LearningGoalDetailResponse,
} from "../types";

export const productivityApi = {
  getMastery: (): Promise<TopicMasteryData> =>
    apiClient.get(ENDPOINTS.ANALYSIS.MASTERY, schemas.TopicMasteryDataSchema),

  listGoals: (): Promise<LearningGoalListItem[]> =>
    apiClient.get(
      ENDPOINTS.LEARNING_GOALS.ALL,
      schemas.LearningGoalListResponseSchema,
    ),

  getGoal: (id: string): Promise<LearningGoalDetailResponse> =>
    apiClient.get(
      ENDPOINTS.LEARNING_GOALS.DETAIL(id),
      schemas.LearningGoalDetailResponseSchema,
    ),

  createGoal: (data: {
    name: string;
    deadline?: string;
  }): Promise<LearningGoalDetailResponse> =>
    apiClient.post(
      ENDPOINTS.LEARNING_GOALS.ALL,
      data,
      schemas.LearningGoalDetailResponseSchema,
    ),

  updateGoal: (
    id: string,
    data: { name?: string; deadline?: string },
  ): Promise<LearningGoalDetailResponse> =>
    apiClient.put(
      ENDPOINTS.LEARNING_GOALS.DETAIL(id),
      data,
      schemas.LearningGoalDetailResponseSchema,
    ),

  deleteGoal: (id: string): Promise<void> =>
    apiClient.delete(ENDPOINTS.LEARNING_GOALS.DETAIL(id), {}, z.void()),

  addItemToGoal: (
    goalId: string,
    data: { collectionId?: string; documentId?: string },
  ): Promise<void> =>
    apiClient.post(ENDPOINTS.LEARNING_GOALS.ITEMS(goalId), data, z.void()),

  removeItemFromGoal: (itemId: string): Promise<void> =>
    apiClient.delete(ENDPOINTS.LEARNING_GOALS.REMOVE_ITEM(itemId), {}, z.void()),
};
