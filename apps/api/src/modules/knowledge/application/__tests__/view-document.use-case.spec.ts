import { ViewDocumentUseCase } from '../view-document.use-case.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';
import type {
  ChunkRepository,
  ChunkWithMeta,
} from '../../domain/chunk-repository.interface.js';
import type { ChunkEntity } from '../../domain/chunk.entity.js';
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
    status: 'COMPLETED',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

function createChunkWithMetaFixture(
  overrides: Partial<ChunkEntity> = {},
  meta: {
    tags?: string[];
    note?: string | null;
    importanceScore?: number | null;
  } = {},
): ChunkWithMeta {
  return {
    chunk: {
      id: 'chunk-1',
      documentId: 'doc-1',
      content: 'chunk content',
      startOffset: 0,
      endOffset: 100,
      createdAt: new Date('2025-01-01T00:00:00Z'),
      ...overrides,
    },
    tags: meta.tags ?? [],
    note: meta.note ?? null,
    importanceScore: meta.importanceScore ?? null,
  };
}

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  private readonly documents: Map<string, DocumentEntity> = new Map();

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

  updateStatus(id: string, status: IngestionStatus): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) doc.status = status;
    return Promise.resolve();
  }
}

class FakeChunkRepository implements ChunkRepository {
  private readonly chunksByDoc: Map<string, ChunkWithMeta[]> = new Map();

  seed(documentId: string, chunks: ChunkWithMeta[]): void {
    this.chunksByDoc.set(documentId, chunks);
  }

  findByDocumentId(documentId: string): Promise<ChunkWithMeta[]> {
    return Promise.resolve(this.chunksByDoc.get(documentId) ?? []);
  }

  findById(_chunkId: string): Promise<ChunkWithMeta | null> {
    return Promise.resolve(null);
  }

  createMany(
    _documentId: string,
    _chunks: Array<{ content: string; startOffset: number; endOffset: number }>,
  ): Promise<ChunkEntity[]> {
    return Promise.resolve([]);
  }

  updateImportance(_chunkId: string, _score: number): Promise<void> {
    return Promise.resolve();
  }
}

// ── Tests ──

describe('ViewDocumentUseCase', () => {
  let useCase: ViewDocumentUseCase;
  let documentRepository: FakeDocumentRepository;
  let chunkRepository: FakeChunkRepository;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    chunkRepository = new FakeChunkRepository();
    useCase = new ViewDocumentUseCase(documentRepository, chunkRepository);
  });

  it('should return the document detail with chunks', async () => {
    const doc = createDocumentFixture({ id: 'doc-1' });
    documentRepository.seed(doc);

    const chunks = [
      createChunkWithMetaFixture(
        { id: 'c1', documentId: 'doc-1', content: 'First chunk' },
        { tags: ['test'], note: 'a note', importanceScore: 3 },
      ),
    ];
    chunkRepository.seed('doc-1', chunks);

    const result = await useCase.execute('doc-1');

    expect(result.id).toBe('doc-1');
    expect(result.title).toBe('Test Doc');
    expect(result.rawContent).toBe('raw content here');
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0]?.content).toBe('First chunk');
    expect(result.chunks[0]?.tags).toEqual(['test']);
    expect(result.chunks[0]?.note).toBe('a note');
    expect(result.chunks[0]?.importanceScore).toBe(3);
  });

  it('should throw when the document is not found', async () => {
    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      'Document not found: nonexistent',
    );
  });
});
