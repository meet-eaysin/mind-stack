"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  StickyNote,
  Star,
  Trash2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDocument,
  useAddTag,
  useRemoveTag,
  useAddNote,
  useUpdateImportance,
  useDeleteDocument,
} from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { ExportActions } from "@/features/export/components/export-actions";

export function DocumentDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, error } = useDocument(id);
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const addNote = useAddNote();
  const updateImportance = useUpdateImportance();
  const deleteDocument = useDeleteDocument();
  const [newTag, setNewTag] = useState("");
  const [noteContent, setNoteContent] = useState("");

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

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{doc.title}</h2>
          <p className="text-sm text-muted-foreground">
            {doc.sourceType} · {doc.status} · {doc.chunks.length} chunks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this document?")
              ) {
                deleteDocument.mutate(doc.id, {
                  onSuccess: onBack,
                });
              }
            }}
            disabled={deleteDocument.isPending}
            data-testid="delete-document-btn"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <ExportActions chunkIds={doc.chunks.map((c) => c.id)} />
        </div>
      </div>

      {/* Document-level metadata */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="size-3 text-muted-foreground" />
          {doc.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
              data-testid={`tag-${tag}`}
            >
              {tag}
              <button
                onClick={() =>
                  removeTag.mutate({ documentId: doc.id, tagName: tag })
                }
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newTag.trim()) {
                addTag.mutate({ documentId: doc.id, tagName: newTag.trim() });
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
              data-testid="add-tag-input"
            />
          </form>
        </div>

        {/* Note */}
        {doc.note ? (
          <div
            className="flex items-start gap-1.5 rounded-md bg-muted p-2"
            data-testid="document-note"
          >
            <StickyNote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{doc.note}</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (noteContent.trim()) {
                addNote.mutate({
                  documentId: doc.id,
                  content: noteContent.trim(),
                });
                setNoteContent("");
              }
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Add a note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="h-7 text-xs"
              data-testid="add-note-input"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              disabled={addNote.isPending}
            >
              Add
            </Button>
          </form>
        )}

        {/* Importance */}
        <div className="flex items-center gap-1">
          <Star className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">
            Importance:
          </span>
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() =>
                updateImportance.mutate({ documentId: doc.id, score })
              }
              className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                doc.importanceScore === score
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
              data-testid={`importance-btn-${score}`}
              aria-label={`Set importance to ${score}`}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="reading" className="gap-2">
            <BookOpen className="size-4" /> Reading View
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <Layers className="size-4" /> Analysis View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="mt-0 outline-none">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
              {doc.rawContent}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="mt-0 outline-none">
          <div className="space-y-3" data-testid="chunk-list">
            {doc.chunks.map((chunk, index) => (
              <div
                key={chunk.id}
                className="rounded-lg border bg-card p-4"
                data-testid={`chunk-card-${chunk.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Chunk {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {chunk.startOffset}–{chunk.endOffset}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{chunk.content}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
