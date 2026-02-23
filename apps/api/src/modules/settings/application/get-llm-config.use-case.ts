import type { UserLlmConfigResponse } from '@repo/shared-types';
import { ResolveLlmConfigUseCase } from './resolve-llm-config.use-case.js';

export class GetLlmConfigUseCase {
  constructor(private readonly resolveConfig: ResolveLlmConfigUseCase) {}

  async execute(userId: string): Promise<UserLlmConfigResponse> {
    const config = await this.resolveConfig.execute(userId);
    return {
      userId: config.userId,
      embeddingProvider: config.embeddingProvider,
      embeddingModel: config.embeddingModel,
      generationProvider: config.generationProvider,
      generationModel: config.generationModel,
    };
  }
}
