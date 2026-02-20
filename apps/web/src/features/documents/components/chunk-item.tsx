"use client";

import React, { useState } from "react";
import { Tag, FileText, Star, X, Plus } from "lucide-react";
import {
  useAddTag,
  useRemoveTag,
  useAddNote,
  useUpdateImportance,
} from "../hooks";
import type { Chunk } from "@/types/api";

type ChunkItemProps = {
  chunk: Chunk;
  onUpdate: (updatedChunk: Chunk) => void;
};

export function ChunkItem({
  chunk,
  onUpdate,
}: ChunkItemProps): React.JSX.Element {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(chunk.note || "");
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Mutations
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const addNote = useAddNote();
  const updateImportance = useUpdateImportance();

  const handleUpdateImportance = async (score: number) => {
    const originalScore = chunk.importanceScore;
    // Optimistic update
    const updated = { ...chunk, importanceScore: score };
    onUpdate(updated);

    try {
      await updateImportance.mutateAsync({ chunkId: chunk.id, score });
    } catch (err) {
      console.error("Failed to update importance", err);
      // Rollback
      onUpdate({ ...chunk, importanceScore: originalScore });
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    const tagName = newTag.trim();
    if (chunk.tags.includes(tagName)) {
      setNewTag("");
      setIsAddingTag(false);
      return;
    }

    // Optimistic update
    const updated = { ...chunk, tags: [...chunk.tags, tagName] };
    onUpdate(updated);
    setNewTag("");
    setIsAddingTag(false);

    try {
      await addTag.mutateAsync({ chunkId: chunk.id, tagName });
    } catch (err) {
      console.error("Failed to add tag", err);
      // Rollback
      const rolledBack = {
        ...chunk,
        tags: chunk.tags.filter((t: string) => t !== tagName),
      };
      onUpdate(rolledBack);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    // Optimistic update
    const updated = {
      ...chunk,
      tags: chunk.tags.filter((t: string) => t !== tagName),
    };
    onUpdate(updated);

    try {
      await removeTag.mutateAsync({ chunkId: chunk.id, tagName });
    } catch (err) {
      console.error("Failed to remove tag", err);
      // Rollback
      const rolledBack = { ...chunk, tags: [...chunk.tags, tagName] };
      onUpdate(rolledBack);
    }
  };

  const handleSaveNote = async () => {
    const originalNote = chunk.note;
    // Optimistic update
    const updated = { ...chunk, note: noteContent };
    onUpdate(updated);
    setIsEditingNote(false);

    try {
      await addNote.mutateAsync({ chunkId: chunk.id, content: noteContent });
    } catch (err) {
      console.error("Failed to save note", err);
      // Rollback
      const rolledBack = { ...chunk, note: originalNote };
      onUpdate(rolledBack);
      setNoteContent(originalNote || "");
    }
  };

  return (
    <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
            {chunk.content}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleUpdateImportance(score)}
                className={`w-6 h-6 flex items-center justify-center transition-colors ${
                  (chunk.importanceScore || 0) >= score
                    ? "text-yellow-500"
                    : "text-gray-700 hover:text-gray-500"
                }`}
                type="button"
                aria-label={`Set importance score to ${score}`}
              >
                <Star
                  className={`w-4 h-4 ${(chunk.importanceScore || 0) >= score ? "fill-current" : ""}`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Tag className="w-3.5 h-3.5 text-gray-500" />
        {chunk.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded-full text-xs font-medium"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-white transition-colors"
              aria-label={`Remove tag ${tag}`}
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {isAddingTag ? (
          <form onSubmit={handleAddTag} className="inline-flex">
            <input
              autoFocus
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onBlur={() => !newTag && setIsAddingTag(false)}
              className="bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 text-xs text-white outline-none focus:border-blue-500 w-24"
              placeholder="Tag name..."
            />
          </form>
        ) : (
          <button
            onClick={() => setIsAddingTag(true)}
            className="flex items-center gap-1 px-2 py-0.5 bg-gray-800 hover:bg-gray-750 text-gray-400 border border-transparent rounded-full text-xs transition-colors"
            type="button"
          >
            <Plus className="w-3 h-3" />
            Add Tag
          </button>
        )}
      </div>

      <div className="border-t border-gray-850 pt-3">
        {isEditingNote ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Write a note about this chunk..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditingNote(false);
                  setNoteContent(chunk.note || "");
                }}
                className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                type="button"
              >
                Save Note
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingNote(true)}
            className="flex items-start gap-2 cursor-pointer group/note"
          >
            <FileText className="w-3.5 h-3.5 text-gray-500 mt-1" />
            <p
              className={`text-sm leading-relaxed ${chunk.note ? "text-gray-300" : "text-gray-500 italic"}`}
            >
              {chunk.note || "Add a private note..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
