import type { EmbeddingModelHealthResponse } from '@repo/shared-types';
import { MODEL_PROVIDER } from '@repo/shared-types';
import { ResolveLlmConfigUseCase } from './resolve-llm-config.use-case.js';
import type { EmbeddingModelRegistry } from './update-llm-config.use-case.js';

export type ResolveLlmConfigPort = {
  execute(userId: string): ReturnType<ResolveLlmConfigUseCase['execute']>;
};

export class CheckEmbeddingModelUseCase {
  constructor(
    private readonly resolveConfig: ResolveLlmConfigPort,
    private readonly modelRegistry: EmbeddingModelRegistry,
  ) {}

  async execute(userId: string): Promise<EmbeddingModelHealthResponse> {
    const config = await this.resolveConfig.execute(userId);
    if (config.embeddingProvider !== MODEL_PROVIDER.OLLAMA) {
      return {
        provider: config.embeddingProvider,
        model: config.embeddingModel,
        baseUrl: config.baseUrl,
        available: false,
        reason: 'Unsupported embedding provider',
      };
    }

    const available = await this.modelRegistry.hasModel(config.embeddingModel);
    return {
      provider: config.embeddingProvider,
      model: config.embeddingModel,
      baseUrl: config.baseUrl,
      available,
      reason: available
        ? undefined
        : `Embedding model not available: ${config.embeddingModel}`,
    };
  }
}
