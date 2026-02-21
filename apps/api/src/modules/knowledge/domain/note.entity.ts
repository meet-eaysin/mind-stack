export type NoteEntity = {
  id: string;
  documentId: string;
  chunkId?: string | null;
  selectedText?: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};
