import { AddNoteUseCase } from '../add-note.use-case.js';
import type { NoteRepository } from '../../domain/note-repository.interface.js';
import type { NoteEntity } from '../../domain/note.entity.js';

// ── Fakes ──

class FakeNoteRepository implements NoteRepository {
  private readonly notes: NoteEntity[] = [];
  private idCounter = 0;

  createForDocument(documentId: string, content: string): Promise<NoteEntity> {
    this.idCounter += 1;
    const note: NoteEntity = {
      id: `note-${String(this.idCounter)}`,
      documentId,
      content,
      createdAt: new Date(),
    };
    this.notes.push(note);
    return Promise.resolve(note);
  }

  update(noteId: string, content: string): Promise<NoteEntity> {
    const note = this.notes.find((n) => n.id === noteId);
    if (!note) {
      throw new Error(`Note not found: ${noteId}`);
    }
    note.content = content;
    return Promise.resolve(note);
  }

  findByDocumentId(documentId: string): Promise<NoteEntity | null> {
    return Promise.resolve(
      this.notes.find((n) => n.documentId === documentId) ?? null,
    );
  }
}

// ── Tests ──

describe('AddNoteUseCase', () => {
  let useCase: AddNoteUseCase;
  let noteRepository: FakeNoteRepository;

  beforeEach(() => {
    noteRepository = new FakeNoteRepository();
    useCase = new AddNoteUseCase(noteRepository);
  });

  it('should create a note and return the NoteEntity', async () => {
    const result = await useCase.execute({
      documentId: 'doc-abc',
      content: 'This is important',
    });

    expect(result.id).toBeDefined();
    expect(result.documentId).toBe('doc-abc');
    expect(result.content).toBe('This is important');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should persist the note in the repository', async () => {
    await useCase.execute({
      documentId: 'doc-xyz',
      content: 'Saved note',
    });

    const found = await noteRepository.findByDocumentId('doc-xyz');
    expect(found).not.toBeNull();
    expect(found?.content).toBe('Saved note');
  });
});
