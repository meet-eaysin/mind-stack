import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "./api";
import { QUERY_KEYS } from "@/api/query-keys";
import type { ApiError } from "@/api/client";
import type { DailyReviewResponse } from "@/types/api";

export function useDailyReview() {
  return useQuery<DailyReviewResponse, ApiError>({
    queryKey: QUERY_KEYS.review.daily,
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
      // Invalidate daily review to refresh the list after feedback
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.review.daily });
    },
  });
}
