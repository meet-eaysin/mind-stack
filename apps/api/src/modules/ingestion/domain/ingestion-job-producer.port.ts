/**
 * Interface for enqueuing ingestion jobs.
 * This allows use-case tests to use fake implementations
 * without depending on the concrete BullMQ-based producer.
 */
export type IngestionJobProducerPort = {
  enqueueUrlExtractionJob(documentId: string, userId: string): Promise<string>;
  enqueueChunkingJob(documentId: string, userId: string): Promise<string>;
  enqueueEmbeddingJob(documentId: string, userId: string): Promise<string>;
  enqueueConceptExtractionJob(
    documentId: string,
    userId: string,
  ): Promise<string>;
};
