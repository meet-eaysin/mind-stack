import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ApiError } from "@/lib/api-client";
import type { DailyReviewResponse } from "../types";

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
    { documentId: string; score: number }
  >({
    mutationFn: ({ documentId, score }) =>
      reviewApi.submitFeedback(documentId, score),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REVIEW.DAILY });
    },
  });
}
