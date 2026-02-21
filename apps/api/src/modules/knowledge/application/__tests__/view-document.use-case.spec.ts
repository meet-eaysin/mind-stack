import { ViewDocumentUseCase } from '../view-document.use-case.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';
import type { ChunkRepository } from '../../domain/chunk-repository.interface.js';
import type { ChunkEntity } from '../../domain/chunk.entity.js';
import type { TagRepository } from '../../domain/tag-repository.interface.js';
import type { TagEntity } from '../../domain/tag.entity.js';
import type { NoteRepository } from '../../domain/note-repository.interface.js';
import type { NoteEntity } from '../../domain/note.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

// ── Fixtures ──

function createDocumentFixture(
  overrides: Partial<DocumentEntity> = {},
): DocumentEntity {
  return {
    id: 'doc-1',
    title: 'Test Doc',
    sourceType: 'URL',
    sourceUrl: 'https://example.com',
    rawContent: 'raw content here',
    status: 'READY',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createChunkFixture(overrides: Partial<ChunkEntity> = {}): ChunkEntity {
  return {
    id: 'chunk-1',
    documentId: 'doc-1',
    content: 'chunk content',
    startOffset: 0,
    endOffset: 100,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  private readonly documents: Map<string, DocumentEntity> = new Map();
  private readonly importance: Map<string, number> = new Map();

  seed(doc: DocumentEntity): void {
    this.documents.set(doc.id, doc);
  }

  save(document: DocumentEntity): Promise<DocumentEntity> {
    this.documents.set(document.id, document);
    return Promise.resolve(document);
  }

  findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.documents.get(id) ?? null);
  }

  findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(Array.from(this.documents.values()));
  }

  findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    return Promise.resolve(
      Array.from(this.documents.values()).find((d) => d.sourceUrl === url) ??
        null,
    );
  }

  updateStatus(id: string, status: IngestionStatus): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) doc.status = status;
    return Promise.resolve();
  }

  updateImportance(id: string, score: number): Promise<void> {
    this.importance.set(id, score);
    return Promise.resolve();
  }

  getImportance(id: string): Promise<number | null> {
    return Promise.resolve(this.importance.get(id) ?? null);
  }
}

class FakeChunkRepository implements ChunkRepository {
  private readonly chunksByDoc: Map<string, ChunkEntity[]> = new Map();

  seed(documentId: string, chunks: ChunkEntity[]): void {
    this.chunksByDoc.set(documentId, chunks);
  }

  findByDocumentId(documentId: string): Promise<ChunkEntity[]> {
    return Promise.resolve(this.chunksByDoc.get(documentId) ?? []);
  }

  async findById(_chunkId: string): Promise<ChunkEntity | null> {
    return Promise.resolve(null);
  }

  async createMany(
    _documentId: string,
    _chunks: Array<{ content: string; startOffset: number; endOffset: number }>,
  ): Promise<ChunkEntity[]> {
    return Promise.resolve([]);
  }

  async deleteByDocumentId(_documentId: string): Promise<void> {
    return Promise.resolve();
  }
}

class FakeTagRepository implements TagRepository {
  private readonly tagsByDoc: Map<string, TagEntity[]> = new Map();

  seed(documentId: string, tags: TagEntity[]): void {
    this.tagsByDoc.set(documentId, tags);
  }

  findOrCreate(name: string): Promise<TagEntity> {
    return Promise.resolve({ id: `tag-${name}`, name });
  }

  addTagToDocument(_documentId: string, _tagId: string): Promise<void> {
    return Promise.resolve();
  }

  removeTagFromDocument(_documentId: string, _tagName: string): Promise<void> {
    return Promise.resolve();
  }

  findByDocumentId(documentId: string): Promise<TagEntity[]> {
    return Promise.resolve(this.tagsByDoc.get(documentId) ?? []);
  }
}

class FakeNoteRepository implements NoteRepository {
  private readonly notesByDoc: Map<string, NoteEntity> = new Map();

  seed(documentId: string, note: NoteEntity): void {
    this.notesByDoc.set(documentId, note);
  }

  createForDocument(documentId: string, content: string): Promise<NoteEntity> {
    const note: NoteEntity = {
      id: `note-new`,
      documentId,
      content,
      createdAt: new Date(),
    };
    this.notesByDoc.set(documentId, note);
    return Promise.resolve(note);
  }

  update(noteId: string, content: string): Promise<NoteEntity> {
    for (const note of this.notesByDoc.values()) {
      if (note.id === noteId) {
        note.content = content;
        return Promise.resolve(note);
      }
    }
    throw new Error(`Note not found: ${noteId}`);
  }

  findByDocumentId(documentId: string): Promise<NoteEntity | null> {
    return Promise.resolve(this.notesByDoc.get(documentId) ?? null);
  }
}

// ── Tests ──

describe('ViewDocumentUseCase', () => {
  let useCase: ViewDocumentUseCase;
  let documentRepository: FakeDocumentRepository;
  let chunkRepository: FakeChunkRepository;
  let tagRepository: FakeTagRepository;
  let noteRepository: FakeNoteRepository;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    chunkRepository = new FakeChunkRepository();
    tagRepository = new FakeTagRepository();
    noteRepository = new FakeNoteRepository();
    useCase = new ViewDocumentUseCase(
      documentRepository,
      chunkRepository,
      tagRepository,
      noteRepository,
    );
  });

  it('should return the document detail with chunks, tags, note, and importance', async () => {
    const doc = createDocumentFixture({ id: 'doc-1' });
    documentRepository.seed(doc);
    await documentRepository.updateImportance('doc-1', 3);

    const chunks = [
      createChunkFixture({
        id: 'c1',
        documentId: 'doc-1',
        content: 'First chunk',
      }),
    ];
    chunkRepository.seed('doc-1', chunks);
    tagRepository.seed('doc-1', [{ id: 'tag-1', name: 'test' }]);
    noteRepository.seed('doc-1', {
      id: 'note-1',
      documentId: 'doc-1',
      content: 'a note',
      createdAt: new Date(),
    });

    const result = await useCase.execute('doc-1');

    expect(result.id).toBe('doc-1');
    expect(result.title).toBe('Test Doc');
    expect(result.rawContent).toBe('raw content here');
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]?.content).toBe('First chunk');
    expect(result.tags).toEqual(['test']);
    expect(result.note).toBe('a note');
    expect(result.importanceScore).toBe(3);
  });

  it('should throw when the document is not found', async () => {
    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      'Document not found: nonexistent',
    );
  });
});
