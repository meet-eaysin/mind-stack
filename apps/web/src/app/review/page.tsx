"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck } from "lucide-react";
import { useDailyReview } from "@/features/review";
import { getApiErrorMessage } from "@/lib/api-client";
import { ReviewCard } from "@/features/review";

export default function ReviewPage() {
  const { data, isLoading, error } = useDailyReview();
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = data?.items.length ?? 0;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

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
          <div
            className="mx-auto max-w-2xl space-y-4"
            data-testid="review-loading"
          >
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div
            className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            data-testid="review-error"
          >
            {getApiErrorMessage(error)}
          </div>
        )}

        {data && data.items.length === 0 && (
          <div
            className="flex flex-col items-center gap-3 py-12 text-center"
            data-testid="review-empty"
          >
            <CalendarCheck className="size-12 text-muted-foreground" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No items to review today. Come back tomorrow.
            </p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Review date: {data.date}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1" />

            <ReviewCard
              item={data.items[currentIndex] || data.items[total - 1]}
              index={Math.min(currentIndex, total - 1)}
              total={total}
              onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              onNext={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
