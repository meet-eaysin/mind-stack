"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Calendar,
  BookOpen,
  Clock,
  Star,
  CheckCircle2,
} from "lucide-react";
import {
  useDailyReview,
  useSubmitFeedback,
  useUpdateReviewScore,
} from "@/features/review/hooks";
import { DocumentListSkeleton } from "@/components/skeletons";
import { ApiError as ApiErrorUI } from "@/components/api-error";
import type { ReviewItem } from "@/types/api";

export default function ReviewPage(): React.JSX.Element {
  // Optimistic removal state — we hide items immediately on feedback
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useDailyReview();
  const submitFeedback = useSubmitFeedback();
  const updateScoreMut = useUpdateReviewScore();

  const items: ReviewItem[] = (data?.items ?? []).filter(
    (item) => !dismissed.has(item.chunkId),
  );
  const date = data?.date ?? "";

  const handleFeedback = (chunkId: string, score: number) => {
    // Optimistic immediate hide
    setDismissed((prev) => new Set(prev).add(chunkId));
    submitFeedback.mutate({ chunkId, score });
  };

  const handleUpdateScore = (chunkId: string, score: number) => {
    updateScoreMut.mutate({ chunkId, score });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-10 animate-in fade-in duration-700">
      <header className="space-y-4 border-b border-gray-800 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-400" />
            Daily Review
          </h1>
          {date && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>
        <p className="text-gray-400 text-lg max-w-2xl">
          Resurfacing knowledge from your past readings. Review these chunks to
          strengthen your memory and help the system understand what&apos;s
          important to you.
        </p>
      </header>

      {isLoading ? (
        <DocumentListSkeleton />
      ) : error ? (
        <ApiErrorUI error={error} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <div className="text-center py-24 bg-gray-900 border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-green-900/10 rounded-full flex items-center justify-center border border-green-900/30">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">All Caught Up!</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              You&apos;ve reviewed all recommended items for today. New
              knowledge will resurface tomorrow.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {items.map((item, idx) => (
            <div
              key={item.chunkId}
              className="group animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl hover:border-gray-700 transition-all">
                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-900/20 rounded-lg">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-300 truncate max-w-[250px]">
                        {item.documentTitle}
                      </span>
                    </div>
                    {item.lastReviewedAt && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last:{" "}
                        {new Date(item.lastReviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-850 p-4 rounded-xl border border-gray-800 italic text-gray-300 text-sm leading-relaxed border-l-4 border-l-blue-600">
                      {item.summary}
                    </div>

                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-6 group-hover:line-clamp-none transition-all duration-500">
                        {item.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500/60 uppercase tracking-widest pl-1">
                      <Sparkles className="w-3 h-3" />
                      Reason: {item.reason}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Rate Relevance
                  </span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleFeedback(item.chunkId, score)}
                        className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all font-bold flex items-center justify-center gap-1 group/btn shadow-lg"
                        type="button"
                        aria-label={`Rate ${score} stars`}
                      >
                        <Star
                          className={`w-4 h-4 ${score <= 3 ? "" : "fill-current"}`}
                        />
                        <span className="hidden group-hover/btn:block text-[10px]">
                          {score}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800/50">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    Adjust Base Importance
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => handleUpdateScore(item.chunkId, score)}
                        disabled={updateScoreMut.isPending}
                        className="w-6 h-6 rounded-full border border-gray-700 text-gray-400 text-[10px] hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all font-bold flex items-center justify-center disabled:opacity-50"
                        type="button"
                        aria-label={`Set base score to ${score}`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
