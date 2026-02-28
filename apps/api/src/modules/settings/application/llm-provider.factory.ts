import {
  GeminiEmbeddingProvider,
  OllamaEmbeddingProvider,
  OpenAIEmbeddingProvider,
  OpenRouterEmbeddingProvider,
  type EmbeddingProvider,
} from '@repo/embeddings';
import {
  GeminiLLMProvider,
  OllamaLLMProvider,
  OpenAILLMProvider,
  OpenRouterLLMProvider,
  type LLMProvider,
} from '@repo/llm';
import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
} from '@repo/shared-types';
import { BadRequestException } from '@nestjs/common';
import type { ResolveLlmConfigUseCase } from '@/modules/settings/application/resolve-llm-config.use-case';
import type { LlmSecretCipher } from '@/modules/settings/application/llm-secret-cipher';
import { providerSupportsCapability } from '@/modules/settings/domain/provider-catalog';

export type LlmProviderFactoryPort = {
  getEmbeddingProvider(userId: string): Promise<EmbeddingProvider>;
  getGenerationProvider(userId: string): Promise<LLMProvider>;
};

type ResolveLlmConfigPort = {
  execute(
    userId: string,
    preferredCapability?: ModelCapability,
  ): ReturnType<ResolveLlmConfigUseCase['execute']>;
};

type SecretCipherPort = Pick<LlmSecretCipher, 'decrypt'>;

type ProviderRuntimeConfig = {
  provider: (typeof MODEL_PROVIDER)[keyof typeof MODEL_PROVIDER];
  model: string;
  baseUrl: string;
  apiKey: string | null;
  enabledCapabilities: ModelCapability[];
};

export class LlmProviderFactory implements LlmProviderFactoryPort {
  constructor(
    private readonly resolveConfig: ResolveLlmConfigPort,
    private readonly secretCipher: SecretCipherPort,
  ) {}

  async getEmbeddingProvider(userId: string): Promise<EmbeddingProvider> {
    const config = await this.getRuntimeConfig(userId, MODEL_CAPABILITY.EMBEDDING);
    this.assertCapability(config, MODEL_CAPABILITY.EMBEDDING);

    if (config.provider === MODEL_PROVIDER.OLLAMA) {
      return new OllamaEmbeddingProvider({
        baseUrl: config.baseUrl,
        model: config.model,
      });
    }

    const apiKey = this.requireApiKey(config);

    if (config.provider === MODEL_PROVIDER.OPENAI) {
      return new OpenAIEmbeddingProvider({
        baseUrl: config.baseUrl,
        apiKey,
        model: config.model,
      });
    }

    if (config.provider === MODEL_PROVIDER.OPENROUTER) {
      return new OpenRouterEmbeddingProvider({
        baseUrl: config.baseUrl,
        apiKey,
        model: config.model,
      });
    }

    return new GeminiEmbeddingProvider({
      baseUrl: config.baseUrl,
      apiKey,
      model: config.model,
    });
  }

  async getGenerationProvider(userId: string): Promise<LLMProvider> {
    const config = await this.getRuntimeConfig(userId, MODEL_CAPABILITY.CHAT);
    this.assertCapability(config, MODEL_CAPABILITY.CHAT);

    if (config.provider === MODEL_PROVIDER.OLLAMA) {
      return new OllamaLLMProvider({
        baseUrl: config.baseUrl,
        model: config.model,
      });
    }

    const apiKey = this.requireApiKey(config);

    if (config.provider === MODEL_PROVIDER.OPENAI) {
      return new OpenAILLMProvider({
        baseUrl: config.baseUrl,
        apiKey,
        model: config.model,
      });
    }

    if (config.provider === MODEL_PROVIDER.OPENROUTER) {
      return new OpenRouterLLMProvider({
        baseUrl: config.baseUrl,
        apiKey,
        model: config.model,
      });
    }

    return new GeminiLLMProvider({
      baseUrl: config.baseUrl,
      apiKey,
      model: config.model,
    });
  }

  private async getRuntimeConfig(
    userId: string,
    preferredCapability: ModelCapability,
  ): Promise<ProviderRuntimeConfig> {
    const config = await this.resolveConfig.execute(userId, preferredCapability);

    return {
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: this.secretCipher.decrypt(config.encryptedApiKey),
      enabledCapabilities: config.enabledCapabilities,
    };
  }

  private assertCapability(
    config: ProviderRuntimeConfig,
    capability: ModelCapability,
  ): void {
    if (!providerSupportsCapability(config.provider, capability)) {
      throw new BadRequestException(
        `Provider ${config.provider} does not support ${capability}`,
      );
    }

    if (!config.enabledCapabilities.includes(capability)) {
      throw new BadRequestException(
        `Capability ${capability} is disabled for this user configuration`,
      );
    }
  }

  private requireApiKey(config: ProviderRuntimeConfig): string {
    if (config.apiKey && config.apiKey.trim().length > 0) {
      return config.apiKey;
    }

    throw new BadRequestException(
      `Provider ${config.provider} requires an API key`,
    );
  }
}
