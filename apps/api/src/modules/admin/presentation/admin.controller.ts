import { Controller, Get, Post } from '@nestjs/common';
import { GetQueueMetricsUseCase } from '../application/get-queue-metrics.use-case.js';
import { CleanupConceptsUseCase } from '../application/cleanup-concepts.use-case.js';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly getQueueMetrics: GetQueueMetricsUseCase,
    private readonly cleanupConcepts: CleanupConceptsUseCase,
  ) {}

  @Get('jobs')
  async getJobs() {
    return this.getQueueMetrics.execute();
  }

  @Post('cleanup')
  async runCleanup() {
    return this.cleanupConcepts.execute();
  }
}
