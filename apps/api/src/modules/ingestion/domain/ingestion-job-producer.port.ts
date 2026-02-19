/**
 * Interface for enqueuing ingestion jobs.
 * This allows use-case tests to use fake implementations
 * without depending on the concrete BullMQ-based producer.
 */
export interface IngestionJobProducerPort {
  enqueueChunkingJob(documentId: string): Promise<void>;
}
