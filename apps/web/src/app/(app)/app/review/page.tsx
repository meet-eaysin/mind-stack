"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, Sparkles, Trophy } from "lucide-react";
import { useDailyReview } from "@/features/review";
import { getApiErrorMessage } from "@/lib/api-client";
import { ReviewCard } from "@/features/review";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AppPage,
  AppPageActions,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page";
import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function ReviewPage() {
  const { data, isLoading, error } = useDailyReview();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const total = data?.items.length ?? 0;
  const progress = total > 0 ? (reviewedIds.size / total) * 100 : 0;
  const isComplete = reviewedIds.size >= total && total > 0;

  const handleNext = () => {
    if (data?.items[currentIndex]) {
      setReviewedIds((prev) =>
        new Set(prev).add(data.items[currentIndex].documentId),
      );
    }
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  return (
    <AppPage>
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle>Daily Review</AppPageTitle>
          <AppPageDescription>
            Strengthen your knowledge through spaced repetition.
          </AppPageDescription>
        </AppPageHeading>
        {data && total > 0 && (
          <AppPageActions className="hidden text-right sm:block">
            <div className="text-right">
              <p className="text-sm font-medium">
                {reviewedIds.size} of {total} reviewed
              </p>
              <p className="text-xs text-muted-foreground">{data.date}</p>
            </div>
          </AppPageActions>
        )}
      </AppPageHeader>
      <AppPageContent className="gap-5">
        {data && total > 0 && (
          <div className="space-y-1.5">
            <Progress
              value={progress}
              className={cn(
                "h-2 transition-all",
                isComplete && "bg-emerald-100 dark:bg-emerald-900/30",
              )}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}% complete</span>
              {total - reviewedIds.size > 0 && (
                <span>{total - reviewedIds.size} remaining</span>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <PageSkeleton
            className="mx-auto max-w-2xl"
            data-testid="review-loading"
            rows={4}
          />
        )}

        {/* Error */}
        {error && (
          <div
            className="mx-auto max-w-2xl rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive"
            data-testid="review-error"
          >
            {getApiErrorMessage(error)}
          </div>
        )}

        {/* Empty */}
        {data && data.items.length === 0 && (
          <div
            className="flex flex-col items-center gap-4 py-20 text-center"
            data-testid="review-empty"
          >
            <div className="p-4 rounded-full bg-emerald-500/10">
              <CalendarCheck className="size-12 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold">All caught up!</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                No items scheduled for review today. Your next review session
                will be ready tomorrow.
              </p>
            </div>
          </div>
        )}

        {/* Completed All Reviews */}
        {isComplete && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="p-4 rounded-full bg-amber-500/10">
              <Trophy className="size-12 text-amber-500" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" />
                Session Complete!
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                You&apos;ve reviewed all {total} items for today. Great work
                strengthening your knowledge!
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentIndex(0);
                setReviewedIds(new Set());
              }}
              className="mt-2"
            >
              Review Again
            </Button>
          </div>
        )}

        {/* Active Review Card */}
        {data && total > 0 && !isComplete && (
          <div className="mx-auto max-w-2xl">
            <ReviewCard
              item={data.items[currentIndex] || data.items[total - 1]}
              index={Math.min(currentIndex, total - 1)}
              total={total}
              onPrevAction={handlePrev}
              onNextAction={handleNext}
            />
          </div>
        )}
      </AppPageContent>
    </AppPage>
  );
}
