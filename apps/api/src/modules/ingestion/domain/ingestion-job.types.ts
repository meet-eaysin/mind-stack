import { JobType } from '@repo/shared-types';

export type IngestionJobData = {
  documentId: string;
  userId?: string;
  rawContent?: string;
};

export type IngestionJob = {
  name: JobType | string;
  data: IngestionJobData;
};
