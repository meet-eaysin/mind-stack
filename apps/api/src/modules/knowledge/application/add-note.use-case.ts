import type { AnnotationType } from '@repo/shared-types';
import type { NoteRepository } from '@/modules/knowledge/domain/note-repository.interface';
import type { NoteEntity } from '@/modules/knowledge/domain/note.entity';

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
