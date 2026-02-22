import { Injectable } from '@nestjs/common';
import { IngestionJobProducer } from '../infrastructure/ingestion-job.producer.js';
import type { IngestionJobStatusResponse } from '@repo/shared-types';

@Injectable()
export class GetIngestionJobStatusUseCase {
  constructor(private readonly jobProducer: IngestionJobProducer) {}

  async execute(jobId: string): Promise<IngestionJobStatusResponse> {
    const status = await this.jobProducer.getJobStatus(jobId);
    if (!status) {
      return {
        jobId,
        state: 'unknown',
        progress: 0,
      };
    }

    return {
      jobId: status.jobId,
      state: status.state as IngestionJobStatusResponse['state'],
      progress: typeof status.progress === 'number' ? status.progress : 0,
      reason: status.reason || undefined,
    };
  }
}
