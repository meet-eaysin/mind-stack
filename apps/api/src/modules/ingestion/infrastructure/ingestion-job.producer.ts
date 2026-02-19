import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { JOB_TYPE } from '@repo/shared-types';

export const INGESTION_QUEUE = 'ingestion';

interface ChunkingJobData {
  documentId: string;
}

@Injectable()
export class IngestionJobProducer {
  constructor(@InjectQueue(INGESTION_QUEUE) private readonly queue: Queue) {}

  async enqueueChunkingJob(documentId: string): Promise<void> {
    const data: ChunkingJobData = { documentId };
    await this.queue.add(JOB_TYPE.CHUNKING, data, {
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
