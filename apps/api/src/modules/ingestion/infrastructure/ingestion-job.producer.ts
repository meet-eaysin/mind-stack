import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { JOB_TYPE, type JobType } from '@repo/shared-types';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port.js';
import type { IngestionJobData } from '../domain/ingestion-job.types.js';

export const INGESTION_QUEUE = 'ingestion';

@Injectable()
export class IngestionJobProducer implements IngestionJobProducerPort {
  constructor(
    @InjectQueue(INGESTION_QUEUE)
    private readonly queue: Queue<IngestionJobData, void, JobType>,
  ) {}

  async enqueueChunkingJob(documentId: string): Promise<void> {
    await this.addJob(JOB_TYPE.CHUNKING, { documentId });
  }

  async enqueueEmbeddingJob(documentId: string): Promise<void> {
    await this.addJob(JOB_TYPE.EMBEDDING, { documentId });
  }

  async enqueueConceptExtractionJob(documentId: string): Promise<void> {
    await this.addJob(JOB_TYPE.CONCEPT_EXTRACTION, { documentId });
  }

  private async addJob(type: JobType, data: IngestionJobData): Promise<void> {
    await this.queue.add(type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
