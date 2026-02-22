import { IngestPdfUseCase } from '../ingest-pdf.use-case.js';
import type { DocumentRepository } from '../../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../../domain/ingestion-job-producer.port.js';
import type { DocumentEntity } from '../../domain/document.entity.js';
import {
  type IngestionStatus,
  INGESTION_STATUS,
  type LearningStatus,
} from '@repo/shared-types';

jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation(() => {
      return {
        getText: jest.fn().mockResolvedValue({
          text: 'Extracted PDF text content',
        }),
      };
    }),
  };
});

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

describe('IngestPdfUseCase', () => {
  let useCase: IngestPdfUseCase;
  let documentRepository: FakeDocumentRepository;
  let jobProducer: FakeIngestionJobProducer;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    jobProducer = new FakeIngestionJobProducer();
    useCase = new IngestPdfUseCase(documentRepository, jobProducer);
  });

  it('should save a PDF document and enqueue a chunking job', async () => {
    const pdfBase64 = Buffer.from('mock pdf').toString('base64');
    const result = await useCase.execute({
      title: 'Manual.pdf',
      fileBase64: pdfBase64,
    });

    expect(result.documentId).toBeDefined();
    expect(documentRepository.saved).toHaveLength(1);

    const saved = documentRepository.saved[0];
    expect(saved?.title).toBe('Manual.pdf');
    expect(saved?.sourceType).toBe('PDF');
    expect(saved?.status).toBe(INGESTION_STATUS.INGESTED);

    expect(jobProducer.enqueuedIds).toHaveLength(1);
    expect(jobProducer.enqueuedIds[0]).toBe(result.documentId);
  });
});
