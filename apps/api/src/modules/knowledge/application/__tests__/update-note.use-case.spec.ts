import { UpdateNoteUseCase } from '../update-note.use-case.js';
import type { NoteRepository } from '../../domain/note-repository.interface.js';
import type { NoteEntity } from '../../domain/note.entity.js';

// ── Fakes ──

class FakeNoteRepository implements NoteRepository {
  private readonly notes: Map<string, NoteEntity> = new Map();

  seed(note: NoteEntity): void {
    this.notes.set(note.id, { ...note });
  }

  create(chunkId: string, content: string): Promise<NoteEntity> {
    const note: NoteEntity = {
      id: `note-${String(this.notes.size + 1)}`,
      chunkId,
      content,
      createdAt: new Date(),
    };
    this.notes.set(note.id, note);
    return Promise.resolve(note);
  }

  update(noteId: string, content: string): Promise<NoteEntity> {
    const note = this.notes.get(noteId);
    if (!note) {
      throw new Error(`Note not found: ${noteId}`);
    }
    note.content = content;
    return Promise.resolve(note);
  }

  findByChunkId(chunkId: string): Promise<NoteEntity | null> {
    for (const note of this.notes.values()) {
      if (note.chunkId === chunkId) return Promise.resolve(note);
    }
    return Promise.resolve(null);
  }
}

// ── Tests ──

describe('UpdateNoteUseCase', () => {
  let useCase: UpdateNoteUseCase;
  let noteRepository: FakeNoteRepository;

  beforeEach(() => {
    noteRepository = new FakeNoteRepository();
    useCase = new UpdateNoteUseCase(noteRepository);
  });

  it('should update the note content and return the updated entity', async () => {
    noteRepository.seed({
      id: 'note-1',
      chunkId: 'chunk-1',
      content: 'old content',
      createdAt: new Date('2025-01-01T00:00:00Z'),
    });

    const result = await useCase.execute({
      noteId: 'note-1',
      content: 'new content',
    });

    expect(result.id).toBe('note-1');
    expect(result.content).toBe('new content');
  });

  it('should throw when the note does not exist', async () => {
    await expect(
      useCase.execute({ noteId: 'nonexistent', content: 'anything' }),
    ).rejects.toThrow('Note not found: nonexistent');
  });
});
