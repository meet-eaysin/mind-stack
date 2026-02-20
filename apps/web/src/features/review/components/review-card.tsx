"use client";

import { useState } from "react";
import { ThumbsUp, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSubmitFeedback, useUpdateReviewScore } from "../hooks";
import type { ReviewItem } from "../types";

export function ReviewCard({
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
    <div
      className="mx-auto max-w-2xl space-y-4"
      data-testid={`review-card-${item.chunkId}`}
    >
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
        data-testid="toggle-summary-btn"
      >
        {showSummary ? "Hide Summary" : "Show Summary"}
      </Button>

      {showSummary && (
        <div
          className="rounded-lg border bg-muted p-4"
          data-testid="review-summary"
        >
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
              data-testid={`recall-btn-${score}`}
              aria-label={`Rate recall ${score}`}
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
              data-testid={`importance-btn-${score}`}
              aria-label={`Set importance ${score}`}
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
          data-testid="prev-btn"
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={index >= total - 1}
          data-testid="next-btn"
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
