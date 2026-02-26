import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
  type ModelProvider,
} from '@repo/shared-types';

export const PROVIDER_CAPABILITIES: Record<ModelProvider, ModelCapability[]> = {
  [MODEL_PROVIDER.OLLAMA]: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
  [MODEL_PROVIDER.OPENAI]: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
  [MODEL_PROVIDER.OPENROUTER]: [
    MODEL_CAPABILITY.CHAT,
    MODEL_CAPABILITY.EMBEDDING,
  ],
  [MODEL_PROVIDER.GEMINI]: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
};

export const providerSupportsCapability = (
  provider: ModelProvider,
  capability: ModelCapability,
): boolean => {
  return PROVIDER_CAPABILITIES[provider].includes(capability);
};
