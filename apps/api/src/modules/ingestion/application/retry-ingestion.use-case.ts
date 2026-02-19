import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port.js';

export class RetryIngestionUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(documentId: string): Promise<void> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    if (document.status !== 'FAILED') {
      throw new Error(`Cannot retry document with status: ${document.status}`);
    }

    await this.documentRepository.updateStatus(documentId, 'INGESTED');
    await this.jobProducer.enqueueChunkingJob(documentId);
  }
}
