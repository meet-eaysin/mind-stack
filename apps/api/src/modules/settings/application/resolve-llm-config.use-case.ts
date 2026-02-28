import type { LlmConfigRepository } from '@/modules/settings/domain/llm-config.repository.interface';
import type { ModelCapability, ModelProvider } from '@repo/shared-types';
import { MODEL_CAPABILITY, MODEL_PROVIDER } from '@repo/shared-types';
import { ConfigService } from '@nestjs/config';

export type ResolvedLlmConfig = {
  userId: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  encryptedApiKey: string | null;
  enabledCapabilities: ModelCapability[];
};

export class ResolveLlmConfigUseCase {
  constructor(
    private readonly repository: LlmConfigRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    userId: string,
    preferredCapability: ModelCapability = MODEL_CAPABILITY.CHAT,
  ): Promise<ResolvedLlmConfig> {
    const stored = await this.repository.findByUserId(userId);

    if (stored) {
      return {
        userId: stored.userId,
        provider: stored.provider,
        model: stored.model,
        baseUrl: this.resolveBaseUrlForProvider(
          stored.provider,
          stored.baseUrl,
        ),
        encryptedApiKey: stored.encryptedApiKey,
        enabledCapabilities: stored.enabledCapabilities,
      };
    }

    return {
      userId,
      provider: MODEL_PROVIDER.OLLAMA,
      model:
        preferredCapability === MODEL_CAPABILITY.EMBEDDING
          ? this.configService.getOrThrow<string>('OLLAMA_EMBED_MODEL')
          : this.configService.getOrThrow<string>('OLLAMA_MODEL'),
      baseUrl: this.configService.getOrThrow<string>('OLLAMA_BASE_URL'),
      encryptedApiKey: null,
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    };
  }

  resolveBaseUrlForProvider(
    provider: ModelProvider,
    baseUrl: string | null | undefined,
  ): string {
    if (baseUrl && baseUrl.trim().length > 0) {
      return baseUrl;
    }

    if (provider === MODEL_PROVIDER.OLLAMA) {
      return this.configService.getOrThrow<string>('OLLAMA_BASE_URL');
    }

    if (provider === MODEL_PROVIDER.OPENAI) {
      const configured = this.configService.get<string>('OPENAI_BASE_URL');
      if (configured && configured.trim().length > 0) {
        return configured;
      }
      throw new Error('OpenAI base URL is required');
    }

    if (provider === MODEL_PROVIDER.OPENROUTER) {
      const configured = this.configService.get<string>('OPENROUTER_BASE_URL');
      if (configured && configured.trim().length > 0) {
        return configured;
      }
      throw new Error('OpenRouter base URL is required');
    }

    const configured = this.configService.get<string>('GEMINI_BASE_URL');
    if (configured && configured.trim().length > 0) {
      return configured;
    }
    throw new Error('Gemini base URL is required');
  }
}
