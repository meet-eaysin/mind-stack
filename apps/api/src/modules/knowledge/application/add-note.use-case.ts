import type { AnnotationType } from '@repo/shared-types';
import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { NoteEntity } from '../domain/note.entity.js';

export class AddNoteUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: {
    documentId: string;
    content: string;
    type?: AnnotationType | undefined;
    chunkId?: string | null | undefined;
    selectedText?: string | null | undefined;
    metadata?: Record<string, unknown> | null | undefined;
  }): Promise<NoteEntity> {
    return this.noteRepository.createForDocument(
      input.documentId,
      input.content,
      input.type ?? undefined,
      input.chunkId ?? undefined,
      input.selectedText ?? undefined,
      input.metadata ?? undefined,
    );
  }
}
