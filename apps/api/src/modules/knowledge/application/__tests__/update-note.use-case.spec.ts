import { UpdateNoteUseCase } from '../update-note.use-case.js';
import type { AnnotationType } from '@repo/shared-types';
import type { NoteRepository } from '../../domain/note-repository.interface.js';
import type { NoteEntity } from '../../domain/note.entity.js';

// ── Fakes ──

class FakeNoteRepository implements NoteRepository {
  private readonly notes: Map<string, NoteEntity> = new Map();

  seed(note: NoteEntity): void {
    this.notes.set(note.id, { ...note });
  }

  createForDocument(
    documentId: string,
    content: string,
    type?: AnnotationType,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NoteEntity> {
    const note: NoteEntity = {
      id: `note-${String(this.notes.size + 1)}`,
      documentId,
      content,
      type: type ?? 'NOTE',
      chunkId: chunkId ?? null,
      selectedText: selectedText ?? null,
      metadata: metadata ?? null,
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

  findManyByDocumentId(documentId: string): Promise<NoteEntity[]> {
    return Promise.resolve(
      Array.from(this.notes.values()).filter(
        (n) => n.documentId === documentId,
      ),
    );
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
      documentId: 'doc-1',
      content: 'old content',
      type: 'NOTE',
      chunkId: null,
      selectedText: null,
      metadata: null,
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
