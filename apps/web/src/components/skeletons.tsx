import React from "react";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={`bg-gray-800 animate-pulse rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function DocumentListSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-2 p-4 border border-gray-800 rounded-lg"
        >
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChunkSkeleton(): React.JSX.Element {
  return (
    <div className="p-4 border border-gray-800 rounded-lg space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

export function GraphSkeleton(): React.JSX.Element {
  return (
    <div className="w-full h-[600px] flex items-center justify-center border border-gray-800 rounded-lg bg-gray-900 overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="grid grid-cols-4 gap-20">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="w-12 h-12 rounded-full" />
          ))}
        </div>
      </div>
      <div className="text-gray-500 font-medium">
        Building graph visualization...
      </div>
    </div>
  );
}
