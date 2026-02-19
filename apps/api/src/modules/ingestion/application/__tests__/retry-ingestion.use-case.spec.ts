import { RetryIngestionUseCase } from '../retry-ingestion.use-case.js';
import type { DocumentRepository } from '../../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../../domain/ingestion-job-producer.port.js';
import type { DocumentEntity } from '../../domain/document.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

// ── Fixtures ──

function createDocumentFixture(
  overrides: Partial<DocumentEntity> = {},
): DocumentEntity {
  return {
    id: 'doc-1',
    title: 'Test Document',
    sourceType: 'URL',
    sourceUrl: 'https://example.com',
    rawContent: 'content',
    status: 'FAILED',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  private readonly documents: Map<string, DocumentEntity> = new Map();

  seed(doc: DocumentEntity): void {
    this.documents.set(doc.id, { ...doc });
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
    if (doc) {
      doc.status = status;
    }
    return Promise.resolve();
  }

  getDocument(id: string): DocumentEntity | undefined {
    return this.documents.get(id);
  }
}

class FakeIngestionJobProducer implements IngestionJobProducerPort {
  readonly enqueuedIds: string[] = [];

  enqueueChunkingJob(documentId: string): Promise<void> {
    this.enqueuedIds.push(documentId);
    return Promise.resolve();
  }
}

// ── Tests ──

describe('RetryIngestionUseCase', () => {
  let useCase: RetryIngestionUseCase;
  let documentRepository: FakeDocumentRepository;
  let jobProducer: FakeIngestionJobProducer;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    jobProducer = new FakeIngestionJobProducer();
    useCase = new RetryIngestionUseCase(documentRepository, jobProducer);
  });

  it('should reset a FAILED document to PENDING and enqueue a chunking job', async () => {
    const doc = createDocumentFixture({ id: 'doc-fail', status: 'FAILED' });
    documentRepository.seed(doc);

    await useCase.execute('doc-fail');

    const updated = documentRepository.getDocument('doc-fail');
    expect(updated?.status).toBe('PENDING');
    expect(jobProducer.enqueuedIds).toEqual(['doc-fail']);
  });

  it('should throw when the document is not found', async () => {
    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      'Document not found: nonexistent',
    );
  });

  it('should throw when the document status is not FAILED', async () => {
    const doc = createDocumentFixture({ id: 'doc-ok', status: 'COMPLETED' });
    documentRepository.seed(doc);

    await expect(useCase.execute('doc-ok')).rejects.toThrow(
      'Cannot retry document with status: COMPLETED',
    );
  });
});
