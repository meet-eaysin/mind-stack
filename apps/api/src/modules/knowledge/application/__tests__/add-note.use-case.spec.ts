import { AddNoteUseCase } from '@/modules/knowledge/application/add-note.use-case';
import type { AnnotationType } from '@repo/shared-types';
import type { NoteRepository } from '@/modules/knowledge/domain/note-repository.interface';
import type { NoteEntity } from '@/modules/knowledge/domain/note.entity';

class FakeNoteRepository implements NoteRepository {
  private readonly notes: NoteEntity[] = [];
  private idCounter = 0;

  async createForDocument(
    documentId: string,
    content: string,
    type?: AnnotationType,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NoteEntity> {
    this.idCounter += 1;
    const note: NoteEntity = {
      id: `note-${String(this.idCounter)}`,
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

    const found = await noteRepository.findManyByDocumentId('doc-xyz');
    expect(found).toHaveLength(1);
    expect(found[0]?.content).toBe('Saved note');
  });
});
