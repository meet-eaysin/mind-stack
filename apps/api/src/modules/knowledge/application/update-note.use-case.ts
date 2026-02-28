import type { NoteRepository } from '@/modules/knowledge/domain/note-repository.interface';
import type { NoteEntity } from '@/modules/knowledge/domain/note.entity';

export class UpdateNoteUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: {
    noteId: string;
    content: string;
  }): Promise<NoteEntity> {
    return this.noteRepository.update(input.noteId, input.content);
  }
}
