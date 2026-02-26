import type { ModelCapability, ModelProvider } from '@repo/shared-types';

export type LlmConfigEntity = {
  id: string;
  userId: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string | null;
  encryptedApiKey: string | null;
  enabledCapabilities: ModelCapability[];
  createdAt: Date;
  updatedAt: Date;
};
