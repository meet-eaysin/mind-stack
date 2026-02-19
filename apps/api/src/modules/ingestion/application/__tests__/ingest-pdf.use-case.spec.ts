import { IngestPdfUseCase } from '../ingest-pdf.use-case.js';
import type { DocumentRepository } from '../../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../../domain/ingestion-job-producer.port.js';
import type { DocumentEntity } from '../../domain/document.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  readonly saved: DocumentEntity[] = [];

  save(document: DocumentEntity): Promise<DocumentEntity> {
    this.saved.push(document);
    return Promise.resolve(document);
  }

  findById(_id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.id === _id) ?? null);
  }

  updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    const doc = this.saved.find((d) => d.id === _id);
    if (doc) {
      doc.status = _status;
    }
    return Promise.resolve();
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

describe('IngestPdfUseCase', () => {
  let useCase: IngestPdfUseCase;
  let documentRepository: FakeDocumentRepository;
  let jobProducer: FakeIngestionJobProducer;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    jobProducer = new FakeIngestionJobProducer();
    useCase = new IngestPdfUseCase(documentRepository, jobProducer);
  });

  it('should decode base64, save a PDF document, and enqueue a chunking job', async () => {
    const textContent = 'PDF text content here';
    const base64Content = Buffer.from(textContent, 'utf-8').toString('base64');

    const result = await useCase.execute({
      title: 'My PDF',
      fileBase64: base64Content,
    });

    expect(result.documentId).toBeDefined();
    expect(documentRepository.saved).toHaveLength(1);

    const saved = documentRepository.saved[0];
    expect(saved).toBeDefined();
    expect(saved?.title).toBe('My PDF');
    expect(saved?.sourceType).toBe('PDF');
    expect(saved?.sourceUrl).toBeNull();
    expect(saved?.rawContent).toBe(textContent);
    expect(saved?.status).toBe('PENDING');

    expect(jobProducer.enqueuedIds).toHaveLength(1);
    expect(jobProducer.enqueuedIds[0]).toBe(result.documentId);
  });
});
