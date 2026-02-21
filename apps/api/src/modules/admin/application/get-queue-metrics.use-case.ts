import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class GetQueueMetricsUseCase {
  constructor(
    @InjectQueue('ingestion') private readonly ingestionQueue: Queue,
  ) {}

  async execute(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const jobCounts = await this.ingestionQueue.getJobCounts(
      'wait',
      'active',
      'completed',
      'failed',
    );

    return {
      waiting: jobCounts['wait'] || 0,
      active: jobCounts['active'] || 0,
      completed: jobCounts['completed'] || 0,
      failed: jobCounts['failed'] || 0,
    };
  }
}
