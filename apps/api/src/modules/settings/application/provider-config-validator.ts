import { BadRequestException } from '@nestjs/common';
import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
  type ModelProvider,
} from '@repo/shared-types';
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
import { providerSupportsCapability } from '../domain/provider-catalog';

export type ProviderValidationInput = {
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  apiKey: string | null;
  enabledCapabilities: ModelCapability[];
};

export class ProviderConfigValidator {
  async validate(input: ProviderValidationInput): Promise<void> {
    this.validateCapabilities(input.provider, input.enabledCapabilities);

    if (input.enabledCapabilities.includes(MODEL_CAPABILITY.EMBEDDING)) {
      const embeddingProvider = this.buildEmbeddingProvider(input);
      await this.validateEmbedding(embeddingProvider, input);
    }

    if (input.enabledCapabilities.includes(MODEL_CAPABILITY.CHAT)) {
      const llmProvider = this.buildLlmProvider(input);
      await this.validateChat(llmProvider, input);
    }
  }

  private validateCapabilities(
    provider: ModelProvider,
    capabilities: ModelCapability[],
  ): void {
    if (capabilities.length === 0) {
      throw new BadRequestException('At least one capability must be enabled');
    }

    for (const capability of capabilities) {
      if (!providerSupportsCapability(provider, capability)) {
        throw new BadRequestException(
          `Provider ${provider} does not support ${capability}`,
        );
      }
    }
  }

  private buildEmbeddingProvider(
    input: ProviderValidationInput,
  ): EmbeddingProvider {
    if (input.provider === MODEL_PROVIDER.OLLAMA) {
      return new OllamaEmbeddingProvider({
        baseUrl: input.baseUrl,
        model: input.model,
      });
    }

    const apiKey = this.requireApiKey(input);

    if (input.provider === MODEL_PROVIDER.OPENAI) {
      return new OpenAIEmbeddingProvider({
        baseUrl: input.baseUrl,
        apiKey,
        model: input.model,
      });
    }

    if (input.provider === MODEL_PROVIDER.OPENROUTER) {
      return new OpenRouterEmbeddingProvider({
        baseUrl: input.baseUrl,
        apiKey,
        model: input.model,
      });
    }

    return new GeminiEmbeddingProvider({
      baseUrl: input.baseUrl,
      apiKey,
      model: input.model,
    });
  }

  private buildLlmProvider(input: ProviderValidationInput): LLMProvider {
    if (input.provider === MODEL_PROVIDER.OLLAMA) {
      return new OllamaLLMProvider({
        baseUrl: input.baseUrl,
        model: input.model,
      });
    }

    const apiKey = this.requireApiKey(input);

    if (input.provider === MODEL_PROVIDER.OPENAI) {
      return new OpenAILLMProvider({
        baseUrl: input.baseUrl,
        apiKey,
        model: input.model,
      });
    }

    if (input.provider === MODEL_PROVIDER.OPENROUTER) {
      return new OpenRouterLLMProvider({
        baseUrl: input.baseUrl,
        apiKey,
        model: input.model,
      });
    }

    return new GeminiLLMProvider({
      baseUrl: input.baseUrl,
      apiKey,
      model: input.model,
    });
  }

  private async validateEmbedding(
    provider: EmbeddingProvider,
    input: ProviderValidationInput,
  ): Promise<void> {
    try {
      const result = await provider.embed('health check');
      if (result.embedding.length === 0) {
        throw new Error('provider returned an empty embedding vector');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(this.toActionableMessage(input, message));
    }
  }

  private async validateChat(
    provider: LLMProvider,
    input: ProviderValidationInput,
  ): Promise<void> {
    try {
      await provider.generate({
        prompt: 'Reply with OK',
        maxTokens: 8,
        temperature: 0,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(this.toActionableMessage(input, message));
    }
  }

  private requireApiKey(input: ProviderValidationInput): string {
    if (input.apiKey && input.apiKey.trim().length > 0) {
      return input.apiKey;
    }

    throw new BadRequestException(
      `Provider ${input.provider} requires an API key`,
    );
  }

  private toActionableMessage(
    input: ProviderValidationInput,
    message: string,
  ): string {
    const normalized = message.toLowerCase();
    if (
      input.provider === MODEL_PROVIDER.OLLAMA &&
      normalized.includes('not found')
    ) {
      return `Ollama model '${input.model}' is not available at ${input.baseUrl}. Run 'ollama pull ${input.model}' and retry.`;
    }

    return message;
  }
}
