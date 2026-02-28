import type { LlmConfigEntity } from '@/modules/settings/domain/llm-config.entity';

export type LlmConfigRepository = {
  findByUserId(userId: string): Promise<LlmConfigEntity | null>;
  deleteByUserId(userId: string): Promise<void>;
  upsertByUserId(
    userId: string,
    data: {
      provider: LlmConfigEntity['provider'];
      model: string;
      baseUrl: string | null;
      encryptedApiKey: string | null;
      enabledCapabilities: LlmConfigEntity['enabledCapabilities'];
    },
  ): Promise<LlmConfigEntity>;
};
