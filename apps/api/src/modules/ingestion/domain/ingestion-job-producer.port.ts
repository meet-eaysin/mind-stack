/**
 * Interface for enqueuing ingestion jobs.
 * This allows use-case tests to use fake implementations
 * without depending on the concrete BullMQ-based producer.
 */
export type IngestionJobProducerPort = {
  enqueueUrlExtractionJob(documentId: string): Promise<void>;
  enqueueChunkingJob(documentId: string): Promise<void>;
  enqueueEmbeddingJob(documentId: string): Promise<void>;
  enqueueConceptExtractionJob(documentId: string): Promise<void>;
};
