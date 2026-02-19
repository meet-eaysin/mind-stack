import type { NoteEntity } from './note.entity.js';

export interface NoteRepository {
  create(chunkId: string, content: string): Promise<NoteEntity>;
  update(noteId: string, content: string): Promise<NoteEntity>;
  findByChunkId(chunkId: string): Promise<NoteEntity | null>;
}
