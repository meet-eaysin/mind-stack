import type { NoteRepository } from '../domain/note-repository.interface.js';
import type { NoteEntity } from '../domain/note.entity.js';

export class AddNoteUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: {
    chunkId: string;
    content: string;
  }): Promise<NoteEntity> {
    return this.noteRepository.create(input.chunkId, input.content);
  }
}
