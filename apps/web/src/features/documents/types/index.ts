import { z } from "zod";
import * as schemas from "../schemas/documents.schemas";
import { ChunkSchema } from "@/schemas/api.schemas";

export type Chunk = z.infer<typeof ChunkSchema>;

export type DocumentListItem = z.infer<typeof schemas.DocumentListItemSchema>;
export type DocumentListResponse = z.infer<
  typeof schemas.DocumentListResponseSchema
>;
export type NoteResponse = {
  id: string;
  content: string;
  chunkId: string | null;
  selectedText?: string; // Changed from string | null to optional string
  metadata?: Record<string, unknown>; // Changed from Record<string, unknown> | null to optional Record
  createdAt: string;
};

export type DocumentDetail = {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string | null;
  status: string;
  rawContent: string;
  chunks: Chunk[];
  tags: string[];
  notes: NoteResponse[];
  importanceScore: number | null;
  createdAt: string;
};
export type DocumentDetailResponse = z.infer<
  typeof schemas.DocumentDetailResponseSchema
>;
export type DocumentStatusResponse = z.infer<
  typeof schemas.DocumentStatusResponseSchema
>;
export type DocumentListRequest = z.infer<
  typeof schemas.DocumentListRequestSchema
>;
export type AddTagRequest = z.infer<typeof schemas.AddTagRequestSchema>;
export type RemoveTagRequest = z.infer<typeof schemas.RemoveTagRequestSchema>;
export type AddNoteRequest = z.infer<typeof schemas.AddNoteRequestSchema>;
export type UpdateNoteRequest = z.infer<typeof schemas.UpdateNoteRequestSchema>;
export type UpdateImportanceRequest = z.infer<
  typeof schemas.UpdateImportanceRequestSchema
>;
export type NoteCreatedResponse = z.infer<
  typeof schemas.NoteCreatedResponseSchema
>;
