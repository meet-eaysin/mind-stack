"use client";

import { StickyNote } from "lucide-react";
import type { ChunkReference } from "@/types";

export function ChunkResult({ chunk }: { chunk: ChunkReference }) {
  return (
    <div
      className="rounded-lg border bg-card p-4"
      data-testid={`chunk-result-${chunk.chunkId}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
          {chunk.documentTitle}
          {chunk.hasNote && (
            <StickyNote className="size-3 text-muted-foreground" />
          )}
        </span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {(chunk.score * 100).toFixed(0)}% match
        </span>
      </div>
      <p className="mb-2 text-sm leading-relaxed">{chunk.content}</p>
      {chunk.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chunk.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
