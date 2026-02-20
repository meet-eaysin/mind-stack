import type { NoteEntity } from './note.entity.js';

export interface NoteRepository {
  createForDocument(documentId: string, content: string): Promise<NoteEntity>;
  update(noteId: string, content: string): Promise<NoteEntity>;
  findByDocumentId(documentId: string): Promise<NoteEntity | null>;
}
