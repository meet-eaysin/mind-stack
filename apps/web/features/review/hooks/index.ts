import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "../api";
import { QUERY_KEYS } from "@/constents/query-keys";
import type { ApiError } from "@/lib/api-client";
import type { DailyReviewResponse } from "@/types";

export function useDailyReview() {
  return useQuery<DailyReviewResponse, ApiError>({
    queryKey: QUERY_KEYS.REVIEW.DAILY,
    queryFn: () => reviewApi.getDaily(),
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean },
    ApiError,
    { chunkId: string; score: number }
  >({
    mutationFn: ({ chunkId, score }) =>
      reviewApi.submitFeedback(chunkId, score),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW.DAILY });
    },
  });
}

export function useUpdateReviewScore() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean },
    ApiError,
    { chunkId: string; score: number }
  >({
    mutationFn: ({ chunkId, score }) => reviewApi.updateScore(chunkId, score),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW.DAILY });
    },
  });
}
