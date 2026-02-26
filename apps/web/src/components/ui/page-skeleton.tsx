import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function PageSkeleton({
  className,
  showHeader = true,
  rows = 3,
}: React.ComponentProps<"div"> & {
  showHeader?: boolean;
  rows?: number;
}) {
  return (
    <div data-slot="page-skeleton" className={cn("space-y-6", className)}>
      {showHeader && (
        <div data-slot="page-skeleton-header" className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      )}
      <div data-slot="page-skeleton-content" className="grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export { PageSkeleton };
