import {
  type IngestionStatus,
  INGESTION_STATUS,
  SOURCE_TYPE,
  type LearningStatus,
} from '@repo/shared-types';
import { RetryIngestionUseCase } from '@/modules/ingestion/application/retry-ingestion.use-case';
import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { IngestionJobProducerPort } from '@/modules/ingestion/domain/ingestion-job-producer.port';
import type { DocumentEntity } from '@/modules/ingestion/domain/document.entity';

// ── Fixtures ──

function createDocumentFixture(
  overrides: Partial<DocumentEntity> = {},
): DocumentEntity {
  return {
    id: 'doc-1',
    title: 'Title',
    userId: 'default',
    sourceType: SOURCE_TYPE.URL,
    sourceUrl: 'https://example.com',
    rawContent: 'Content',
    status: INGESTION_STATUS.FAILED,
    learningStatus: 'UPCOMING',
    type: 'ARTICLE',
    author: null,
    publisher: null,
    publishedAt: null,
    language: 'en',
    addedByUserAt: new Date('2025-01-01T00:00:00Z'),
    createdAt: new Date('2025-01-01T00:00:00Z'),
    processingError: null,
    deletedAt: null,
    ...overrides,
  };
}

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  private readonly documents: Map<string, DocumentEntity> = new Map();

  seed(doc: DocumentEntity): void {
    this.documents.set(doc.id, { ...doc });
  }

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    this.documents.set(document.id, document);
    return Promise.resolve(document);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.documents.get(id) ?? null);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(Array.from(this.documents.values()));
  }

  async findBySourceUrl(
    url: string,
    _userId: string,
  ): Promise<DocumentEntity | null> {
    return Promise.resolve(
      Array.from(this.documents.values()).find((d) => d.sourceUrl === url) ??
        null,
    );
  }

  async updateStatus(id: string, status: IngestionStatus): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      doc.status = status;
    }
    return Promise.resolve();
  }
  async updateProcessingError(
    id: string,
    errorMessage: string | null,
  ): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      doc.processingError = errorMessage;
    }
    return Promise.resolve();
  }

  async updateImportance(_id: string, _score: number): Promise<void> {
    return Promise.resolve();
  }

  async getImportance(_id: string): Promise<number | null> {
    return Promise.resolve(null);
  }

  async addStatusHistory(
    _documentId: string,
    _status: IngestionStatus,
    _learningStatus: LearningStatus,
  ): Promise<void> {
    return Promise.resolve();
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  getDocument(id: string): DocumentEntity | undefined {
    return this.documents.get(id);
  }
}

class FakeIngestionJobProducer implements IngestionJobProducerPort {
  readonly chunkingEnqueuedIds: string[] = [];
  readonly urlExtractionEnqueuedIds: string[] = [];

  async enqueueUrlExtractionJob(documentId: string): Promise<string> {
    this.urlExtractionEnqueuedIds.push(documentId);
    return 'mock-job-id';
  }

  async enqueueChunkingJob(documentId: string): Promise<string> {
    this.chunkingEnqueuedIds.push(documentId);
    return 'mock-job-id';
  }

  async enqueueEmbeddingJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }
  async enqueueConceptExtractionJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
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

  it('should reset a FAILED document to INGESTED and enqueue URL extraction for URL documents without content', async () => {
    const doc = createDocumentFixture({
      id: 'doc-fail',
      status: INGESTION_STATUS.FAILED,
      processingError: 'Embedding failed',
      sourceType: SOURCE_TYPE.URL,
      rawContent: '',
    });
    documentRepository.seed(doc);

    await useCase.execute('doc-fail');

    const updated = documentRepository.getDocument('doc-fail');
    expect(updated?.status).toBe(INGESTION_STATUS.INGESTED);
    expect(updated?.processingError).toBeNull();
    expect(jobProducer.urlExtractionEnqueuedIds).toEqual(['doc-fail']);
    expect(jobProducer.chunkingEnqueuedIds).toEqual([]);
  });

  it('should enqueue chunking when retrying a document that already has raw content', async () => {
    const doc = createDocumentFixture({
      id: 'doc-with-content',
      status: INGESTION_STATUS.FAILED,
      sourceType: SOURCE_TYPE.TEXT,
      rawContent: 'already extracted content',
    });
    documentRepository.seed(doc);

    await useCase.execute('doc-with-content');

    expect(jobProducer.chunkingEnqueuedIds).toEqual(['doc-with-content']);
    expect(jobProducer.urlExtractionEnqueuedIds).toEqual([]);
  });

  it('should throw when the document is not found', async () => {
    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      'Document not found: nonexistent',
    );
  });

  it('should throw when the document status is not FAILED', async () => {
    const doc = createDocumentFixture({
      id: 'doc-ok',
      status: INGESTION_STATUS.READY,
    });
    documentRepository.seed(doc);

    await expect(useCase.execute('doc-ok')).rejects.toThrow(
      'Cannot retry document with status: READY',
    );
  });
});
