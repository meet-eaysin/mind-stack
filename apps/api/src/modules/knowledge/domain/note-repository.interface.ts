import type { NoteEntity } from './note.entity.js';

export type NoteRepository = {
  createForDocument(
    documentId: string,
    content: string,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NoteEntity>;
  update(noteId: string, content: string): Promise<NoteEntity>;
  findManyByDocumentId(documentId: string): Promise<NoteEntity[]>;
};
