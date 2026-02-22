import { ViewDocumentUseCase } from '../view-document.use-case.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';
import type { ChunkRepository } from '../../domain/chunk-repository.interface.js';
import type { ChunkEntity } from '../../domain/chunk.entity.js';
import type { TagRepository } from '../../domain/tag-repository.interface.js';
import type { TagEntity } from '../../domain/tag.entity.js';
import type { NoteRepository } from '../../domain/note-repository.interface.js';
import type { NoteEntity } from '../../domain/note.entity.js';
import {
  type IngestionStatus,
  type AnnotationType,
  type LearningStatus,
} from '@repo/shared-types';

// ── Fixtures ──

function createDocumentFixture(
  overrides: Partial<DocumentEntity> = {},
): DocumentEntity {
  return {
    id: 'doc-1',
    title: 'Title',
    sourceType: 'URL',
    sourceUrl: 'https://example.com',
    rawContent: 'Content',
    status: 'READY',
    learningStatus: 'UPCOMING',
    type: 'ARTICLE',
    author: null,
    publisher: null,
    publishedAt: null,
    language: 'en',
    addedByUserAt: new Date(),
    createdAt: new Date(),
    deletedAt: null,
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

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    this.documents.set(document.id, document);
    return Promise.resolve(document);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    const doc = this.documents.get(id);
    return Promise.resolve(doc && !doc.deletedAt ? doc : null);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(
      Array.from(this.documents.values()).filter((d) => !d.deletedAt),
    );
  }

  async findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    return Promise.resolve(
      Array.from(this.documents.values()).find(
        (d) => d.sourceUrl === url && !d.deletedAt,
      ) ?? null,
    );
  }

  async updateStatus(id: string, status: IngestionStatus): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) doc.status = status;
    return Promise.resolve();
  }

  async updateImportance(id: string, score: number): Promise<void> {
    this.importance.set(id, score);
    return Promise.resolve();
  }

  async getImportance(id: string): Promise<number | null> {
    return Promise.resolve(this.importance.get(id) ?? null);
  }

  async delete(id: string): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      doc.deletedAt = new Date();
    }
  }

  async addStatusHistory(
    _documentId: string,
    _status: IngestionStatus,
    _learningStatus: LearningStatus,
  ): Promise<void> {
    return Promise.resolve();
  }
}

class FakeChunkRepository implements ChunkRepository {
  private readonly chunksByDoc: Map<string, ChunkEntity[]> = new Map();

  seed(documentId: string, chunks: ChunkEntity[]): void {
    this.chunksByDoc.set(documentId, chunks);
  }

  async findByDocumentId(documentId: string): Promise<ChunkEntity[]> {
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

  async findOrCreate(name: string): Promise<TagEntity> {
    return Promise.resolve({ id: `tag-${name}`, name });
  }

  async addTagToDocument(_documentId: string, _tagId: string): Promise<void> {
    return Promise.resolve();
  }

  async removeTagFromDocument(
    _documentId: string,
    _tagName: string,
  ): Promise<void> {
    return Promise.resolve();
  }

  async findByDocumentId(documentId: string): Promise<TagEntity[]> {
    return Promise.resolve(this.tagsByDoc.get(documentId) ?? []);
  }
}

class FakeNoteRepository implements NoteRepository {
  private readonly notesByDoc: Map<string, NoteEntity[]> = new Map();

  seed(documentId: string, note: NoteEntity): void {
    const existing = this.notesByDoc.get(documentId) ?? [];
    this.notesByDoc.set(documentId, [...existing, note]);
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
      id: `note-new`,
      documentId,
      content,
      type: type ?? 'NOTE',
      chunkId: chunkId ?? null,
      selectedText: selectedText ?? null,
      metadata: metadata ?? null,
      createdAt: new Date(),
    };
    const existing = this.notesByDoc.get(documentId) ?? [];
    this.notesByDoc.set(documentId, [...existing, note]);
    return Promise.resolve(note);
  }

  async update(noteId: string, content: string): Promise<NoteEntity> {
    for (const notes of this.notesByDoc.values()) {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        note.content = content;
        return Promise.resolve(note);
      }
    }
    throw new Error(`Note not found: ${noteId}`);
  }

  async findManyByDocumentId(documentId: string): Promise<NoteEntity[]> {
    return Promise.resolve(this.notesByDoc.get(documentId) ?? []);
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
      type: 'NOTE',
      chunkId: null,
      selectedText: null,
      metadata: null,
      createdAt: new Date(),
    });

    const result = await useCase.execute('doc-1');

    expect(result.document.id).toBe('doc-1');
    expect(result.document.title).toBe('Title');
    expect(result.document.rawContent).toBe('Content');
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]?.content).toBe('First chunk');
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0]?.name).toEqual('test');
    expect(result.notes).toHaveLength(1);
    expect(result.notes[0]?.content).toBe('a note');
    expect(result.importanceScore).toBe(3);
  });

  it('should throw when the document is not found', async () => {
    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      'Document not found: nonexistent',
    );
  });
});
