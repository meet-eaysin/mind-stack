import { IngestTextUseCase } from '../ingest-text.use-case.js';
import type { DocumentRepository } from '../../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../../domain/ingestion-job-producer.port.js';
import type { DocumentEntity } from '../../domain/document.entity.js';
import {
  type IngestionStatus,
  INGESTION_STATUS,
  type LearningStatus,
} from '@repo/shared-types';

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  saved: DocumentEntity[] = [];

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    this.saved.push(document);
    return Promise.resolve(document);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.id === id) ?? null);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(this.saved);
  }

  async findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.sourceUrl === url) ?? null);
  }

  async updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    const doc = this.saved.find((d) => d.id === _id);
    if (doc) {
      doc.status = _status;
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
    this.saved = this.saved.filter((d) => d.id !== id);
    return Promise.resolve();
  }
}

class FakeIngestionJobProducer implements IngestionJobProducerPort {
  readonly enqueuedIds: string[] = [];

  async enqueueUrlExtractionJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }

  async enqueueChunkingJob(documentId: string): Promise<string> {
    this.enqueuedIds.push(documentId);
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

describe('IngestTextUseCase', () => {
  let useCase: IngestTextUseCase;
  let documentRepository: FakeDocumentRepository;
  let jobProducer: FakeIngestionJobProducer;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    jobProducer = new FakeIngestionJobProducer();
    useCase = new IngestTextUseCase(documentRepository, jobProducer);
  });

  it('should save a TEXT document and enqueue a chunking job', async () => {
    const result = await useCase.execute({
      title: 'My Note',
      content: 'Some important content',
    });

    expect(result.documentId).toBeDefined();
    expect(documentRepository.saved).toHaveLength(1);

    const saved = documentRepository.saved[0];
    expect(saved).toBeDefined();
    expect(saved?.title).toBe('My Note');
    expect(saved?.sourceType).toBe('TEXT');
    expect(saved?.sourceUrl).toBeNull();
    expect(saved?.rawContent).toBe('Some important content');
    expect(saved?.status).toBe(INGESTION_STATUS.INGESTED);

    expect(jobProducer.enqueuedIds).toHaveLength(1);
    expect(jobProducer.enqueuedIds[0]).toBe(result.documentId);
  });

  it('should store sourceUrl if provided', async () => {
    const result = await useCase.execute({
      title: 'Clip',
      content: 'Clipped content',
      sourceUrl: 'https://example.com/item',
    });

    const saved = documentRepository.saved.find(
      (d) => d.id === result.documentId,
    );
    expect(saved?.sourceUrl).toBe('https://example.com/item');
  });
});
