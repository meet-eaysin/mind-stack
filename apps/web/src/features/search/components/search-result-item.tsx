"use client";

import React from "react";
import { Search } from "lucide-react";
import type { ChunkReference } from "@/types/api";

type SearchResultItemProps = {
  chunk: ChunkReference;
  index: number;
  onScrollTo: (chunkId: string) => void;
  innerRef?: (el: HTMLDivElement | null) => void;
};

export function SearchResultItem({
  chunk,
  index,
  onScrollTo,
  innerRef,
}: SearchResultItemProps): React.JSX.Element {
  return (
    <div
      ref={innerRef}
      className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onScrollTo(chunk.chunkId)}
          className="p-2 bg-gray-800 rounded-lg hover:bg-blue-900/40 text-gray-400 hover:text-blue-400 transition-all block"
          type="button"
          aria-label="Scroll to result"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-blue-900/30 text-blue-500 px-1.5 py-0.5 rounded border border-blue-900/50 uppercase tracking-tighter">
            CHUNK {index + 1}
          </span>
          <span className="text-xs font-bold text-gray-400 truncate max-w-[200px]">
            {chunk.documentTitle}
          </span>
          <span className="text-[10px] text-gray-600 ml-auto font-mono">
            SCORE {(chunk.score * 100).toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
          {chunk.content}
        </p>
        {chunk.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chunk.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
