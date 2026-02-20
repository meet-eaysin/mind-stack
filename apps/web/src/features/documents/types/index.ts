import { z } from "zod";
import * as schemas from "../schemas/documents.schemas";

export type DocumentListItem = z.infer<typeof schemas.DocumentListItemSchema>;
export type DocumentListResponse = z.infer<
  typeof schemas.DocumentListResponseSchema
>;
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
