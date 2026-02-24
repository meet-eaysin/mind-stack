import type { Job } from 'bullmq';
import { JobType } from '@repo/shared-types';

export type IngestionJobData = {
  documentId: string;
  userId?: string;
  rawContent?: string;
};

export type IngestionJob = Job<IngestionJobData, void, JobType>;
