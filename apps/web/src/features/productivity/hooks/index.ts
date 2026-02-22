import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productivityApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ApiError } from "@/lib/api-client";
import type {
  TopicMasteryData,
  LearningGoalListItem,
  LearningGoalDetailResponse,
} from "../types";

export function useTopicMastery() {
  return useQuery<TopicMasteryData, ApiError>({
    queryKey: QUERY_KEYS.ANALYSIS.MASTERY,
    queryFn: () => productivityApi.getMastery(),
  });
}

export function useLearningGoals() {
  return useQuery<LearningGoalListItem[], ApiError>({
    queryKey: QUERY_KEYS.LEARNING_GOALS.LIST,
    queryFn: () => productivityApi.listGoals(),
  });
}

export function useLearningGoal(id: string) {
  return useQuery<LearningGoalDetailResponse, ApiError>({
    queryKey: QUERY_KEYS.LEARNING_GOALS.DETAIL(id),
    queryFn: () => productivityApi.getGoal(id),
    enabled: !!id,
  });
}

export function useCreateLearningGoal() {
  const queryClient = useQueryClient();
  return useMutation<
    LearningGoalDetailResponse,
    ApiError,
    { name: string; deadline?: string }
  >({
    mutationFn: (data) => productivityApi.createGoal(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LEARNING_GOALS.LIST,
      });
    },
  });
}

export function useDeleteLearningGoal() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => productivityApi.deleteGoal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LEARNING_GOALS.LIST,
      });
    },
  });
}
