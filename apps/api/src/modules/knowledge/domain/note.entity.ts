export type NoteEntity = {
  id: string;
  documentId: string;
  chunkId?: string | null;
  content: string;
  createdAt: Date;
};
