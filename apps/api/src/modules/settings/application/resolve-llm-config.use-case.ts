import type { LlmConfigRepository } from '../domain/llm-config.repository.interface.js';
import type { ModelProvider } from '@repo/shared-types';
import { MODEL_PROVIDER } from '@repo/shared-types';
import { ConfigService } from '@nestjs/config';

export type ResolvedLlmConfig = {
  userId: string;
  embeddingProvider: ModelProvider;
  embeddingModel: string;
  generationProvider: ModelProvider;
  generationModel: string;
  baseUrl: string;
};

export class ResolveLlmConfigUseCase {
  constructor(
    private readonly repository: LlmConfigRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string): Promise<ResolvedLlmConfig> {
    const stored = await this.repository.findByUserId(userId);
    const baseUrl = this.configService.getOrThrow<string>('OLLAMA_BASE_URL');
    const defaultEmbedModel =
      this.configService.getOrThrow<string>('OLLAMA_EMBED_MODEL');
    const defaultModel = this.configService.getOrThrow<string>('OLLAMA_MODEL');

    if (stored) {
      return {
        userId: stored.userId,
        embeddingProvider: stored.embeddingProvider,
        embeddingModel: stored.embeddingModel,
        generationProvider: stored.generationProvider,
        generationModel: stored.generationModel,
        baseUrl,
      };
    }

    return {
      userId,
      embeddingProvider: MODEL_PROVIDER.OLLAMA,
      embeddingModel: defaultEmbedModel,
      generationProvider: MODEL_PROVIDER.OLLAMA,
      generationModel: defaultModel,
      baseUrl,
    };
  }
}
