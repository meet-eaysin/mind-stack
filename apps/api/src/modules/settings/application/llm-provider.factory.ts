import type { EmbeddingProvider } from '@repo/embeddings';
import { OllamaEmbeddingProvider } from '@repo/embeddings';
import type { LLMProvider } from '@repo/llm';
import { OllamaLLMProvider } from '@repo/llm';
import { MODEL_PROVIDER } from '@repo/shared-types';
import { ResolveLlmConfigUseCase } from './resolve-llm-config.use-case';
import { BadRequestException } from '@nestjs/common';

export type LlmProviderFactoryPort = {
  getEmbeddingProvider(userId: string): Promise<EmbeddingProvider>;
  getGenerationProvider(userId: string): Promise<LLMProvider>;
};

export class LlmProviderFactory {
  constructor(private readonly resolveConfig: ResolveLlmConfigUseCase) {}

  async getEmbeddingProvider(userId: string): Promise<EmbeddingProvider> {
    const config = await this.resolveConfig.execute(userId);
    if (config.embeddingProvider !== MODEL_PROVIDER.OLLAMA) {
      throw new BadRequestException('Unsupported embedding provider');
    }
    return new OllamaEmbeddingProvider({
      baseUrl: config.baseUrl,
      model: config.embeddingModel,
    });
  }

  async getGenerationProvider(userId: string): Promise<LLMProvider> {
    const config = await this.resolveConfig.execute(userId);
    if (config.generationProvider !== MODEL_PROVIDER.OLLAMA) {
      throw new BadRequestException('Unsupported generation provider');
    }
    return new OllamaLLMProvider({
      baseUrl: config.baseUrl,
      model: config.generationModel,
    });
  }
}
