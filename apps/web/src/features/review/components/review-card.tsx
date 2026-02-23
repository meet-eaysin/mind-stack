"use client";

import { useState } from "react";
import {
  RotateCcw,
  Brain,
  Zap,
  Smile,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  BookOpen,
  CheckCircle2,
  Folder,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSubmitFeedback } from "../hooks";
import { useUpdateDocument } from "@/features/documents";
import { AddToCollectionDialog } from "@/features/collections/components/add-to-collection-dialog";
import { cn } from "@/lib/utils";
import type { ReviewItem } from "../types";
import ReactMarkdown from "react-markdown";
import { LEARNING_STATUS } from "@repo/shared-types";

type FeedbackOption = {
  label: string;
  score: number;
  description: string;
  icon: LucideIcon;
  color: string;
  activeColor: string;
  interval: string;
};

const FEEDBACK_OPTIONS: ReadonlyArray<FeedbackOption> = [
  {
    label: "Again",
    score: 1,
    description: "Didn't remember",
    icon: RotateCcw,
    color:
      "text-red-500 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50",
    activeColor: "bg-red-500 text-white border-red-500",
    interval: "< 1 day",
  },
  {
    label: "Hard",
    score: 3,
    description: "Took effort to recall",
    icon: Brain,
    color:
      "text-orange-500 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50",
    activeColor: "bg-orange-500 text-white border-orange-500",
    interval: "~1 day",
  },
  {
    label: "Good",
    score: 4,
    description: "Remembered with some thought",
    icon: Zap,
    color:
      "text-blue-500 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50",
    activeColor: "bg-blue-500 text-white border-blue-500",
    interval: "~3 days",
  },
  {
    label: "Easy",
    score: 5,
    description: "Instantly recalled",
    icon: Smile,
    color:
      "text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50",
    activeColor: "bg-emerald-500 text-white border-emerald-500",
    interval: "~7 days",
  },
];

export function ReviewCard({
  item,
  onNextAction,
  onPrevAction,
  index,
  total,
}: {
  item: ReviewItem;
  onNextAction: () => void;
  onPrevAction: () => void;
  index: number;
  total: number;
}) {
  const submitFeedback = useSubmitFeedback();
  const updateDocument = useUpdateDocument();
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);

  const handleFeedback = (score: number) => {
    setSelectedScore(score);
    submitFeedback.mutate(
      { documentId: item.documentId, score },
      {
        onSuccess: () => {
          // Brief delay so user sees the selection highlight
          setTimeout(() => {
            setIsRevealed(false);
            setSelectedScore(null);
            onNextAction();
          }, 400);
        },
      },
    );
  };

  const handleMarkComplete = () => {
    updateDocument.mutate({
      id: item.documentId,
      learningStatus: LEARNING_STATUS.COMPLETED,
    });
  };

  return (
    <div className="w-full" data-testid={`review-card-${item.documentId}`}>
      {/* Card Header - Document Info */}
      <div className="mb-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h2 className="text-2xl font-bold tracking-tight leading-tight">
              {item.documentTitle}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {item.lastReviewedAt ? (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Previously reviewed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <Sparkles className="size-3" />
                  First review
                </span>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground tabular-nums shrink-0">
            {index + 1} / {total}
          </span>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-2 py-0 h-5 text-[10px] uppercase tracking-wider font-semibold"
              >
                <Tag className="size-2.5 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Card - The "Flashcard" */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Question / Content side */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            <BookOpen className="size-3.5" />
            Content
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
            <ReactMarkdown>
              {item.content.length > 600
                ? item.content.substring(0, 600) + "..."
                : item.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Reveal Button / Summary */}
        <Separator />
        <div className="bg-muted/30">
          {!isRevealed ? (
            <button
              onClick={() => setIsRevealed(true)}
              className="w-full p-4 sm:p-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer group"
              data-testid="toggle-summary-btn"
            >
              <ChevronDown className="size-4 group-hover:translate-y-0.5 transition-transform" />
              Reveal Summary & Rate Recall
            </button>
          ) : (
            <div
              className="p-6 sm:p-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
              data-testid="review-summary"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Brain className="size-3.5" />
                Summary
                <button
                  onClick={() => setIsRevealed(false)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="size-4" />
                </button>
              </div>
              <p className="text-sm leading-relaxed">{item.summary}</p>
              <p className="text-xs text-muted-foreground italic">
                {item.reason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Buttons */}
      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
          How well did you recall this?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEEDBACK_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedScore === option.score;
            return (
              <button
                key={option.score}
                onClick={() => handleFeedback(option.score)}
                disabled={submitFeedback.isPending}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected ? option.activeColor : option.color,
                )}
                data-testid={`recall-btn-${option.score}`}
                aria-label={`Rate recall: ${option.label}`}
              >
                <Icon className="size-5" />
                <span className="text-sm font-bold">{option.label}</span>
                <span
                  className={cn(
                    "text-[10px]",
                    isSelected ? "text-white/80" : "text-muted-foreground",
                  )}
                >
                  {option.interval}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mt-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={handleMarkComplete}
            disabled={updateDocument.isPending}
          >
            <CheckCircle2 className="size-3.5" />
            Mark Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={() => setShowCollectionDialog(true)}
          >
            <Folder className="size-3.5" />
            Add to Collection
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsRevealed(false);
              setSelectedScore(null);
              onPrevAction();
            }}
            disabled={index === 0}
            className="h-8 text-xs"
            data-testid="prev-btn"
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsRevealed(false);
              setSelectedScore(null);
              onNextAction();
            }}
            disabled={index >= total - 1}
            className="h-8 text-xs"
            data-testid="next-btn"
          >
            Skip →
          </Button>
        </div>
      </div>

      <AddToCollectionDialog
        documentId={item.documentId}
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
      />
    </div>
  );
}
