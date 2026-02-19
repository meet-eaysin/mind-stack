import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducer } from '../infrastructure/ingestion-job.producer.js';

export class RetryIngestionUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducer,
  ) {}

  async execute(documentId: string): Promise<void> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    if (document.status !== 'FAILED') {
      throw new Error(`Cannot retry document with status: ${document.status}`);
    }

    await this.documentRepository.updateStatus(documentId, 'PENDING');
    await this.jobProducer.enqueueChunkingJob(documentId);
  }
}
