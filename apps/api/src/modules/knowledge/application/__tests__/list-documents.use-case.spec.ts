import { ListDocumentsUseCase } from '../list-documents.use-case.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';
import type { ChunkRepository } from '../../domain/chunk-repository.interface.js';
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
    rawContent: 'raw',
    status: 'READY',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  private readonly documents: DocumentEntity[] = [];

  seed(docs: DocumentEntity[]): void {
    this.documents.push(...docs);
  }

  save(document: DocumentEntity): Promise<DocumentEntity> {
    this.documents.push(document);
    return Promise.resolve(document);
  }

  findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.documents.find((d) => d.id === id) ?? null);
  }

  findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(this.documents);
  }

  findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    return Promise.resolve(
      this.documents.find((d) => d.sourceUrl === url) ?? null,
    );
  }

  updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    return Promise.resolve();
  }

  updateImportance(_id: string, _score: number): Promise<void> {
    return Promise.resolve();
  }

  getImportance(_id: string): Promise<number | null> {
    return Promise.resolve(null);
  }
}

class FakeChunkRepository implements ChunkRepository {
  private readonly chunksByDoc: Map<string, ChunkEntity[]> = new Map();

  seed(documentId: string, count: number): void {
    const chunks: ChunkEntity[] = Array.from({ length: count }, (_, i) => ({
      id: `chunk-${documentId}-${String(i)}`,
      documentId,
      content: `content ${String(i)}`,
      startOffset: i * 100,
      endOffset: (i + 1) * 100,
      createdAt: new Date('2025-01-01T00:00:00Z'),
    }));
    this.chunksByDoc.set(documentId, chunks);
  }

  findByDocumentId(documentId: string): Promise<ChunkEntity[]> {
    return Promise.resolve(this.chunksByDoc.get(documentId) ?? []);
  }

  findById(_chunkId: string): Promise<ChunkEntity | null> {
    return Promise.resolve(null);
  }

  createMany(
    _documentId: string,
    _chunks: Array<{ content: string; startOffset: number; endOffset: number }>,
  ): Promise<ChunkEntity[]> {
    return Promise.resolve([]);
  }
}

// ── Tests ──

describe('ListDocumentsUseCase', () => {
  let useCase: ListDocumentsUseCase;
  let documentRepository: FakeDocumentRepository;
  let chunkRepository: FakeChunkRepository;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    chunkRepository = new FakeChunkRepository();
    useCase = new ListDocumentsUseCase(documentRepository, chunkRepository);
  });

  it('should return paginated documents with chunk counts', async () => {
    const docs = [
      createDocumentFixture({ id: 'doc-1', title: 'Doc 1' }),
      createDocumentFixture({ id: 'doc-2', title: 'Doc 2' }),
    ];
    documentRepository.seed(docs);
    chunkRepository.seed('doc-1', 3);
    chunkRepository.seed('doc-2', 1);

    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.total).toBe(2);
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0]?.title).toBe('Doc 1');
    expect(result.documents[0]?.chunkCount).toBe(3);
    expect(result.documents[1]?.title).toBe('Doc 2');
    expect(result.documents[1]?.chunkCount).toBe(1);
  });

  it('should return empty documents when none exist', async () => {
    const result = await useCase.execute({ page: 1, pageSize: 10 });

    expect(result.total).toBe(0);
    expect(result.documents).toHaveLength(0);
  });
});
