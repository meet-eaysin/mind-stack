/**
 * Interface for enqueuing ingestion jobs.
 * This allows use-case tests to use fake implementations
 * without depending on the concrete BullMQ-based producer.
 */
export type IngestionJobProducerPort = {
  enqueueUrlExtractionJob(documentId: string): Promise<string>;
  enqueueChunkingJob(documentId: string): Promise<string>;
  enqueueEmbeddingJob(documentId: string): Promise<string>;
  enqueueConceptExtractionJob(documentId: string): Promise<string>;
};
