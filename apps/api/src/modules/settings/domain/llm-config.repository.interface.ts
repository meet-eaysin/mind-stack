import type { LlmConfigEntity } from './llm-config.entity.js';

export type LlmConfigRepository = {
  findByUserId(userId: string): Promise<LlmConfigEntity | null>;
  upsertByUserId(
    userId: string,
    data: {
      embeddingProvider: LlmConfigEntity['embeddingProvider'];
      embeddingModel: string;
      generationProvider: LlmConfigEntity['generationProvider'];
      generationModel: string;
    },
  ): Promise<LlmConfigEntity>;
};
