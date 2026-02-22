import type { AnnotationType } from '@repo/shared-types';
import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { NoteEntity } from '../domain/note.entity.js';

export class AddNoteUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: {
    documentId: string;
    content: string;
    type?: string;
    chunkId?: string;
    selectedText?: string;
    metadata?: Record<string, unknown>;
  }): Promise<NoteEntity> {
    return this.noteRepository.createForDocument(
      input.documentId,
      input.content,
      input.type as AnnotationType | undefined,
      input.chunkId,
      input.selectedText,
      input.metadata,
    );
  }
}
