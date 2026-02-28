import type { AnnotationType } from '@repo/shared-types';
import type { NoteEntity } from '@/modules/knowledge/domain/note.entity';

export type NoteRepository = {
  createForDocument(
    documentId: string,
    content: string,
    type?: AnnotationType,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NoteEntity>;
  update(noteId: string, content: string): Promise<NoteEntity>;
  findManyByDocumentId(documentId: string): Promise<NoteEntity[]>;
};
