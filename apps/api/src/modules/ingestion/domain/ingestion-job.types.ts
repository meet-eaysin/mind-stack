import { Job } from 'bullmq';
import { JobType } from '@repo/shared-types';

export type IngestionJobData = {
  documentId: string;
};

export type IngestionJob = Job<IngestionJobData, void, JobType>;
