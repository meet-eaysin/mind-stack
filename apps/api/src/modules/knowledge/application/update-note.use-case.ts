import type { NoteRepository } from "../domain/note-repository.interface.js";
import type { NoteEntity } from "../domain/note.entity.js";

export class UpdateNoteUseCase {
  constructor(private readonly noteRepository: NoteRepository) {}

  async execute(input: {
    noteId: string;
    content: string;
  }): Promise<NoteEntity> {
    return this.noteRepository.update(input.noteId, input.content);
  }
}
