"use client";

import { useState } from "react";
import { Tag, StickyNote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAddTag,
  useRemoveTag,
  useAddNote,
  useUpdateImportance,
} from "../hooks";
import type { Chunk } from "@/types";

export function ChunkCard({ chunk }: { chunk: Chunk }) {
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const addNote = useAddNote();
  const updateImportance = useUpdateImportance();
  const [newTag, setNewTag] = useState("");
  const [noteContent, setNoteContent] = useState("");

  return (
    <div
      className="rounded-lg border bg-card p-4"
      data-testid={`chunk-card-${chunk.id}`}
    >
      <p className="mb-3 text-sm leading-relaxed">{chunk.content}</p>

      {/* Tags */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Tag className="size-3 text-muted-foreground" />
        {chunk.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
            data-testid={`tag-${tag}`}
          >
            {tag}
            <button
              onClick={() =>
                removeTag.mutate({ chunkId: chunk.id, tagName: tag })
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
            data-testid="add-tag-input"
          />
        </form>
      </div>

      {/* Note */}
      {chunk.note ? (
        <div
          className="mb-3 flex items-start gap-1.5 rounded-md bg-muted p-2"
          data-testid="chunk-note"
        >
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
            data-testid={`importance-btn-${score}`}
            aria-label={`Set importance to ${score}`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}
