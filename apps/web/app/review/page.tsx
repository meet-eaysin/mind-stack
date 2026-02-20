"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Star,
  ThumbsUp,
} from "lucide-react";
import {
  useDailyReview,
  useSubmitFeedback,
  useUpdateReviewScore,
} from "@/features/review/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ReviewItem } from "@/types";

function ReviewCard({
  item,
  onNext,
  onPrev,
  index,
  total,
}: {
  item: ReviewItem;
  onNext: () => void;
  onPrev: () => void;
  index: number;
  total: number;
}) {
  const submitFeedback = useSubmitFeedback();
  const updateScore = useUpdateReviewScore();
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{item.documentTitle}</span>
        <span>
          {index + 1} / {total}
        </span>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm leading-relaxed">{item.content}</p>
      </div>

      {/* Show/hide summary */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSummary(!showSummary)}
      >
        {showSummary ? "Hide Summary" : "Show Summary"}
      </Button>

      {showSummary && (
        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm">{item.summary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Reason: {item.reason}
          </p>
        </div>
      )}

      <Separator />

      {/* Feedback */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Rate your recall:</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <Button
              key={score}
              variant="outline"
              size="sm"
              onClick={() =>
                submitFeedback.mutate({ chunkId: item.chunkId, score })
              }
              disabled={submitFeedback.isPending}
              className="gap-1"
            >
              <ThumbsUp className="size-3" />
              {score}
            </Button>
          ))}
        </div>
      </div>

      {/* Adjust importance */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Adjust base importance:</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <Button
              key={score}
              variant="secondary"
              size="sm"
              onClick={() =>
                updateScore.mutate({ chunkId: item.chunkId, score })
              }
              disabled={updateScore.isPending}
              className="gap-1"
            >
              <Star className="size-3" />
              {score}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={index === 0}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={index >= total - 1}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const { data, isLoading, error } = useDailyReview();
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Review</h1>
          <p className="text-muted-foreground">
            Practice spaced repetition to strengthen your memory.
          </p>
        </div>

        {isLoading && (
          <div className="mx-auto max-w-2xl space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {getApiErrorMessage(error)}
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarCheck className="size-12 text-muted-foreground" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No items to review today. Come back tomorrow.
            </p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <p className="text-center text-sm text-muted-foreground">
              Review date: {data.date}
            </p>
            <ReviewCard
              item={data.items[currentIndex]}
              index={currentIndex}
              total={data.items.length}
              onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              onNext={() =>
                setCurrentIndex((i) => Math.min(data.items.length - 1, i + 1))
              }
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
