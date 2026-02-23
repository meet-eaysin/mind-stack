import type { ModelProvider } from '@repo/shared-types';

export type LlmConfigEntity = {
  id: string;
  userId: string;
  embeddingProvider: ModelProvider;
  embeddingModel: string;
  generationProvider: ModelProvider;
  generationModel: string;
  createdAt: Date;
  updatedAt: Date;
};
