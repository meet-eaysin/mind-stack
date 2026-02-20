"use client";

import React from "react";
import { BookOpen, Search } from "lucide-react";
import { SearchResultItem } from "./search-result-item";
import { ChunkSkeleton } from "@/components/skeletons";
import { ApiError as ApiErrorUI } from "@/components/api-error";
import type { ChunkReference } from "@/types/api";
import type { ApiError } from "@/api/client";

type SearchResultsListProps = {
  results: ChunkReference[];
  loading: boolean;
  error: ApiError | null;
  mode: "search" | "ask";
  onScrollTo: (chunkId: string) => void;
  onRetry: () => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  hasSearched: boolean;
};

export function SearchResultsList({
  results,
  loading,
  error,
  mode,
  onScrollTo,
  onRetry,
  registerRef,
  hasSearched,
}: SearchResultsListProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        {mode === "ask" ? "Retrieved Citations" : "Search Results"}
        {results.length > 0 && (
          <span className="text-blue-500">({results.length})</span>
        )}
        <span className="h-px flex-1 bg-gray-800 ml-2" />
      </h3>

      {loading ? (
        <div className="space-y-4">
          <ChunkSkeleton />
          <ChunkSkeleton />
          <ChunkSkeleton />
        </div>
      ) : error ? (
        <ApiErrorUI error={error} onRetry={onRetry} />
      ) : results.length === 0 && hasSearched ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900">
          <div className="p-4 bg-gray-850 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-gray-800">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-300">
            No results found
          </h4>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            Try clarifying your query or checking your active filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          {results.map((chunk, idx) => (
            <SearchResultItem
              key={`${chunk.chunkId}-${idx}`}
              chunk={chunk}
              index={idx}
              onScrollTo={onScrollTo}
              innerRef={(el) => registerRef(chunk.chunkId, el)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
