import type { UserLlmConfigResponse } from '@repo/shared-types';
import type { ResolvedLlmConfig } from './resolve-llm-config.use-case.js';

export class GetLlmConfigUseCase {
  constructor(
    private readonly resolveConfig: {
      execute(userId: string): Promise<ResolvedLlmConfig>;
    },
  ) {}

  async execute(userId: string): Promise<UserLlmConfigResponse> {
    const config = await this.resolveConfig.execute(userId);
    return {
      userId: config.userId,
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      enabledCapabilities: config.enabledCapabilities,
      hasApiKey: Boolean(config.encryptedApiKey),
    };
  }
}
