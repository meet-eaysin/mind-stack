"use client";

import React from "react";
import {
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/skeletons";
import type { ChunkReference } from "@/types/api";
import type { ApiError } from "@/api/client";

type AiAnswerProps = {
  answer: string | null;
  loading: boolean;
  error: ApiError | null;
  citations: ChunkReference[];
  mode: "search" | "ask";
  onScrollTo: (chunkId: string) => void;
  onExport: () => void;
};

export function AiAnswer({
  answer,
  loading,
  error,
  citations,
  mode,
  onScrollTo,
  onExport,
}: AiAnswerProps): React.JSX.Element {
  return (
    <div
      className={`space-y-6 transition-all duration-700 ${
        mode === "ask"
          ? "opacity-100 translate-y-0"
          : "opacity-30 pointer-events-none translate-y-4"
      }`}
    >
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-400" />
        AI Generated Answer
        <span className="h-px flex-1 bg-gray-800 ml-2" />
      </h3>

      {loading && mode === "ask" ? (
        <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-4/6" />
          <Skeleton className="h-6 w-full" />
          <div className="flex items-center gap-2 pt-4">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-500 font-medium">
              Synthesizing documents...
            </span>
          </div>
        </div>
      ) : error && mode === "ask" ? (
        <div className="p-6 bg-red-900/10 border border-red-900/30 rounded-2xl flex gap-4 text-red-400">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <h4 className="font-bold mb-1">AI Synthesis Failed</h4>
            <p className="text-sm opacity-80">
              {error.type === "validation"
                ? error.issues.join(", ")
                : error.message}
            </p>
          </div>
        </div>
      ) : answer ? (
        <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1">
            <div className="w-12 h-12 bg-blue-600/10 rounded-bl-full absolute -top-1 -right-1" />
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-gray-200 whitespace-pre-wrap">
              {answer.split(/(\[\d+\])/).map((part, i) => {
                const citationMatch = part.match(/\[(\d+)\]/);
                if (citationMatch && citationMatch[1]) {
                  const index = parseInt(citationMatch[1], 10) - 1;
                  const citation = citations[index];
                  if (citation) {
                    return (
                      <button
                        key={i}
                        onClick={() => onScrollTo(citation.chunkId)}
                        className="inline-flex items-center justify-center w-5 h-5 bg-blue-600/80 hover:bg-blue-500 text-[10px] font-bold rounded-sm mx-1 transition-all hover:scale-125 focus:ring-2 focus:ring-blue-400 outline-none align-top mt-1"
                        title={citation.documentTitle}
                        type="button"
                      >
                        {citationMatch[1]}
                      </button>
                    );
                  }
                }
                return part;
              })}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Verified by {citations.length} sources
            </div>
            <button
              className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              onClick={onExport}
              disabled={citations.length === 0}
              type="button"
            >
              <ExternalLink className="w-3 h-3" />
              Export Chunks
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-40">
          <p className="max-w-xs text-gray-500">
            Questions are answered using only your ingested documents.
          </p>
        </div>
      )}
    </div>
  );
}
