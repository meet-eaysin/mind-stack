"use client";

import { StickyNote, Link as LinkIcon, Calendar } from "lucide-react";
import type { DocumentSearchResult } from "@/types";

export function DocumentResult({
  document,
}: {
  document: DocumentSearchResult;
}) {
  return (
    <div
      className="rounded-lg border bg-card p-4 space-y-4 shadow-sm"
      data-testid={`document-result-${document.documentId}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-primary">
              {document.title}
            </h3>
            {document.hasNote && (
              <StickyNote className="size-4 text-amber-500" />
            )}
          </div>
          <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground border">
            {(document.score * 100).toFixed(0)}% match
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {document.author && <span>By {document.author}</span>}
          {document.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(document.publishedAt).toLocaleDateString()}
            </span>
          )}
          {document.sourceUrl && (
            <a
              href={document.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <LinkIcon className="size-3" />
              Source
            </a>
          )}
        </div>

        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {document.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-muted border px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-1">
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          data-testid={`open-document-${document.documentId}`}
          onClick={() => {
            window.location.href = `/app/documents?id=${document.documentId}`;
          }}
        >
          Open document
        </button>
      </div>
    </div>
  );
}
