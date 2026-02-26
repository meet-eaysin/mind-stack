"use client";

import { useRouter } from "next/navigation";
import { Calendar, Link as LinkIcon, StickyNote } from "lucide-react";
import type { DocumentSearchResult } from "@/types";

export function DocumentResult({
  document,
}: {
  document: DocumentSearchResult;
}) {
  const router = useRouter();

  return (
    <div
      className="cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/30"
      data-testid={`document-result-${document.documentId}`}
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/app/documents/${document.documentId}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/app/documents/${document.documentId}`);
        }
      }}
      aria-label={`Open ${document.title}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-primary">
              {document.title}
            </h3>
            {document.hasNote && (
              <StickyNote className="size-4 text-amber-500" />
            )}
          </div>
          <span className="rounded-full border bg-secondary/80 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
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
              onClick={(event) => event.stopPropagation()}
            >
              <LinkIcon className="size-3" />
              Source
            </a>
          )}
        </div>

        {document.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {document.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
