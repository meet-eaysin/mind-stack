"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Globe,
  Youtube,
  Type,
  File,
  ChevronLeft,
  ChevronRight,
  Tag,
  StickyNote,
  Star,
  ArrowLeft,
} from "lucide-react";
import {
  useDocuments,
  useDocument,
  useAddTag,
  useRemoveTag,
  useAddNote,
  useUpdateImportance,
} from "@/features/documents/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { Chunk } from "@/types";

const sourceTypeIcons: Record<string, React.ElementType> = {
  URL: Globe,
  TEXT: Type,
  PDF: File,
  YOUTUBE: Youtube,
};

function DocumentList({ onSelect }: { onSelect: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 10;

  const { data, isLoading, error } = useDocuments(
    page,
    pageSize,
    searchTerm || undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search documents..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1);
        }}
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {getApiErrorMessage(error)}
        </div>
      )}

      {data && (
        <>
          <div className="space-y-2">
            {data.documents.map((doc) => {
              const Icon = sourceTypeIcons[doc.sourceType] || FileText;
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc.id)}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.chunkCount} chunks ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data.page} · {data.total} total
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={data.page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChunkCard({ chunk }: { chunk: Chunk }) {
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const addNote = useAddNote();
  const updateImportance = useUpdateImportance();
  const [newTag, setNewTag] = useState("");
  const [noteContent, setNoteContent] = useState("");

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-3 text-sm leading-relaxed">{chunk.content}</p>

      {/* Tags */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Tag className="size-3 text-muted-foreground" />
        {chunk.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              onClick={() =>
                removeTag.mutate({ chunkId: chunk.id, tagName: tag })
              }
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </span>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newTag.trim()) {
              addTag.mutate({ chunkId: chunk.id, tagName: newTag.trim() });
              setNewTag("");
            }
          }}
          className="inline-flex"
        >
          <Input
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="h-6 w-20 text-xs"
          />
        </form>
      </div>

      {/* Note */}
      {chunk.note ? (
        <div className="mb-3 flex items-start gap-1.5 rounded-md bg-muted p-2">
          <StickyNote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{chunk.note}</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (noteContent.trim()) {
              addNote.mutate({
                chunkId: chunk.id,
                content: noteContent.trim(),
              });
              setNoteContent("");
            }
          }}
          className="mb-3 flex gap-2"
        >
          <Input
            placeholder="Add a note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="h-7 text-xs"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            className="h-7 text-xs"
          >
            Add
          </Button>
        </form>
      )}

      {/* Importance */}
      <div className="flex items-center gap-1">
        <Star className="size-3 text-muted-foreground" />
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() =>
              updateImportance.mutate({ chunkId: chunk.id, score })
            }
            className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
              chunk.importanceScore === score
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocumentDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading, error } = useDocument(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
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
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {getApiErrorMessage(error)}
      </div>
    );
  }

  if (!data) return null;

  const doc = data.document;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
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

      <div className="space-y-3">
        {doc.chunks.map((chunk) => (
          <ChunkCard key={chunk.id} chunk={chunk} />
        ))}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Browse and manage your ingested knowledge base.
          </p>
        </div>

        {selectedDocId ? (
          <DocumentDetail
            id={selectedDocId}
            onBack={() => setSelectedDocId(null)}
          />
        ) : (
          <DocumentList onSelect={setSelectedDocId} />
        )}
      </div>
    </AppShell>
  );
}
