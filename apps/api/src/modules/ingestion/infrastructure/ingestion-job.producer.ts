import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import { JOB_TYPE, type JobType } from '@repo/shared-types';
import type { IngestionJobProducerPort } from '@/modules/ingestion/domain/ingestion-job-producer.port';
import type { IngestionJobData } from '@/modules/ingestion/domain/ingestion-job.types';

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
    const options = this.optionsFor(type);
    const job = await this.queue.add(type, data, options);
    return job.id!;
  }

  private optionsFor(type: JobType): JobsOptions {
    const base: JobsOptions = {
      removeOnComplete: true,
      removeOnFail: false,
    };

    if (type === JOB_TYPE.CHUNKING) {
      return {
        ...base,
        attempts: 1,
      };
    }

    if (type === JOB_TYPE.EMBEDDING) {
      return {
        ...base,
        attempts: 20,
        backoff: {
          type: 'fixed',
          delay: 15_000,
        },
      };
    }

    if (type === JOB_TYPE.URL_EXTRACTION) {
      return {
        ...base,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3_000,
        },
      };
    }

    if (type === JOB_TYPE.CONCEPT_EXTRACTION) {
      return {
        ...base,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2_000,
        },
      };
    }

    return {
      ...base,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1_000,
      },
    };
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
