import { BadRequestException } from '@nestjs/common';
import type { LlmConfigRepository } from '@/modules/settings/domain/llm-config.repository.interface';
import type {
  ModelCapability,
  ModelProvider,
  UserLlmConfigResponse,
} from '@repo/shared-types';
import type { LlmSecretCipher } from '@/modules/settings/application/llm-secret-cipher';
import type { ProviderConfigValidator } from '@/modules/settings/application/provider-config-validator';

type ProviderConfigValidatorPort = Pick<ProviderConfigValidator, 'validate'>;
type LlmSecretCipherPort = Pick<LlmSecretCipher, 'decrypt' | 'encrypt'>;

export class UpdateLlmConfigUseCase {
  constructor(
    private readonly repository: LlmConfigRepository,
    private readonly validator: ProviderConfigValidatorPort,
    private readonly secretCipher: LlmSecretCipherPort,
  ) {}

  async execute(
    userId: string,
    input: {
      provider: ModelProvider;
      model: string;
      baseUrl: string;
      apiKey?: string | null;
      enabledCapabilities: ModelCapability[];
    },
  ): Promise<UserLlmConfigResponse> {
    const model = input.model.trim();
    if (model.length === 0) {
      throw new BadRequestException('Model is required');
    }

    const baseUrl = input.baseUrl.trim();
    if (baseUrl.length === 0) {
      throw new BadRequestException('Base URL is required');
    }

    const current = await this.repository.findByUserId(userId);
    const effectiveApiKey =
      input.apiKey === undefined
        ? this.secretCipher.decrypt(current?.encryptedApiKey ?? null)
        : (input.apiKey ?? null);

    await this.validator.validate({
      provider: input.provider,
      model,
      baseUrl,
      apiKey: effectiveApiKey,
      enabledCapabilities: input.enabledCapabilities,
    });

    const encryptedApiKey =
      input.apiKey === undefined
        ? (current?.encryptedApiKey ?? null)
        : this.secretCipher.encrypt(input.apiKey);

    const saved = await this.repository.upsertByUserId(userId, {
      provider: input.provider,
      model,
      baseUrl,
      encryptedApiKey,
      enabledCapabilities: input.enabledCapabilities,
    });

    return {
      userId: saved.userId,
      provider: saved.provider,
      model: saved.model,
      baseUrl: saved.baseUrl,
      enabledCapabilities: saved.enabledCapabilities,
      hasApiKey: Boolean(saved.encryptedApiKey),
    };
  }
}
