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

  async enqueueUrlExtractionJob(
    documentId: string,
    userId: string,
  ): Promise<string> {
    return this.addJob(JOB_TYPE.URL_EXTRACTION as JobType, {
      documentId,
      userId,
    });
  }

  async enqueueChunkingJob(
    documentId: string,
    userId: string,
  ): Promise<string> {
    return this.addJob(JOB_TYPE.CHUNKING, { documentId, userId });
  }

  async enqueueEmbeddingJob(
    documentId: string,
    userId: string,
  ): Promise<string> {
    return this.addJob(JOB_TYPE.EMBEDDING, { documentId, userId });
  }

  async enqueueConceptExtractionJob(
    documentId: string,
    userId: string,
  ): Promise<string> {
    return this.addJob(JOB_TYPE.CONCEPT_EXTRACTION, { documentId, userId });
  }

  private async addJob(type: JobType, data: IngestionJobData): Promise<string> {
    const job = await this.queue.add(type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
    return job.id!;
  }

  async getJobStatus(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      jobId: job.id!,
      state,
      progress: job.progress,
      reason: job.failedReason,
    };
  }
}
