"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocument } from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { ChunkCard } from "./chunk-card";

export function DocumentDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, error } = useDocument(id);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="document-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        data-testid="document-detail-error"
      >
        {getApiErrorMessage(error)}
      </div>
    );
  }

  if (!data) return null;

  const doc = data.document;

  return (
    <div className="space-y-4" data-testid="document-detail">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-1.5"
        data-testid="back-button"
      >
        <ArrowLeft className="size-4" />
        Back to list
      </Button>

      <div>
        <h2 className="text-xl font-semibold">{doc.title}</h2>
        <p className="text-sm text-muted-foreground">
          {doc.sourceType} · {doc.status} · {doc.chunks.length} chunks
        </p>
      </div>

      <Separator />

      <div className="space-y-3" data-testid="chunk-list">
        {doc.chunks.map((chunk) => (
          <ChunkCard key={chunk.id} chunk={chunk} />
        ))}
      </div>
    </div>
  );
}
