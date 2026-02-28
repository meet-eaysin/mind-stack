import type { EmbeddingModelHealthResponse } from '@repo/shared-types';
import { MODEL_CAPABILITY } from '@repo/shared-types';
import type { ResolveLlmConfigUseCase } from '@/modules/settings/application/resolve-llm-config.use-case';
import type { LlmProviderFactory } from '@/modules/settings/application/llm-provider.factory';

type ResolveLlmConfigPort = {
  execute(
    userId: string,
    preferredCapability?: (typeof MODEL_CAPABILITY)[keyof typeof MODEL_CAPABILITY],
  ): ReturnType<ResolveLlmConfigUseCase['execute']>;
};

type LlmProviderFactoryPort = Pick<LlmProviderFactory, 'getEmbeddingProvider'>;

export class CheckEmbeddingModelUseCase {
  constructor(
    private readonly resolveConfig: ResolveLlmConfigPort,
    private readonly providerFactory: LlmProviderFactoryPort,
  ) {}

  async execute(userId: string): Promise<EmbeddingModelHealthResponse> {
    const config = await this.resolveConfig.execute(
      userId,
      MODEL_CAPABILITY.EMBEDDING,
    );

    if (!config.enabledCapabilities.includes(MODEL_CAPABILITY.EMBEDDING)) {
      return {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        available: false,
        reason: 'Embedding capability is disabled',
      };
    }

    try {
      const provider = await this.providerFactory.getEmbeddingProvider(userId);
      const result = await provider.embed('health check');
      return {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        available: result.embedding.length > 0,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        available: false,
        reason: message,
      };
    }
  }
}
