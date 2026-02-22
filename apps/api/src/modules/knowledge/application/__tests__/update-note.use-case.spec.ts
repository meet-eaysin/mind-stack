import { UpdateNoteUseCase } from '../update-note.use-case.js';
import type { AnnotationType } from '@repo/shared-types';
import type { NoteRepository } from '../../domain/note-repository.interface.js';
import type { NoteEntity } from '../../domain/note.entity.js';

class FakeNoteRepository implements NoteRepository {
  private readonly notes: NoteEntity[] = [];

  seed(note: NoteEntity): void {
    this.notes.push(note);
  }

  async createForDocument(
    documentId: string,
    content: string,
    type?: AnnotationType,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NoteEntity> {
    const note: NoteEntity = {
      id: `new-note`,
      documentId,
      content,
      type: type ?? 'NOTE',
      chunkId: chunkId ?? null,
      selectedText: selectedText ?? null,
      metadata: metadata ?? null,
      createdAt: new Date(),
    };
    this.notes.push(note);
    return Promise.resolve(note);
  }

  async update(noteId: string, content: string): Promise<NoteEntity> {
    const note = this.notes.find((n) => n.id === noteId);
    if (!note) {
      throw new Error(`Note not found: ${noteId}`);
    }
    note.content = content;
    return Promise.resolve(note);
  }

  async findManyByDocumentId(documentId: string): Promise<NoteEntity[]> {
    return Promise.resolve(
      this.notes.filter((n) => n.documentId === documentId),
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

  it('should update the note content and return the NoteEntity', async () => {
    noteRepository.seed({
      id: 'note-1',
      documentId: 'doc-1',
      content: 'Old content',
      type: 'NOTE',
      chunkId: null,
      selectedText: null,
      metadata: null,
      createdAt: new Date(),
    });

    const result = await useCase.execute({
      noteId: 'note-1',
      content: 'New content',
    });

    expect(result.id).toBe('note-1');
    expect(result.content).toBe('New content');
  });

  it('should throw when the note does not exist', async () => {
    await expect(
      useCase.execute({ noteId: 'missing', content: 'fail' }),
    ).rejects.toThrow('Note not found: missing');
  });
});
