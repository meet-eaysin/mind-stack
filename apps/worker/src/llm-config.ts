import {
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelCapability,
  type ModelProvider,
} from "@repo/shared-types";
import { decryptSecret } from "@repo/config";

export type LlmConfigPrisma = {
  userLlmConfig: {
    findUnique: (args: {
      where: { userId: string };
    }) => Promise<StoredUserLlmConfig | null>;
  };
};

export type StoredUserLlmConfig = {
  provider?: string;
  model?: string;
  baseUrl?: string | null;
  encryptedApiKey?: string | null;
  enabledCapabilities?: string[];
  embeddingProvider?: string;
  embeddingModel?: string;
  generationProvider?: string;
  generationModel?: string;
};

export type ResolvedLlmConfig = {
  userId: string;
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  apiKey: string | null;
  enabledCapabilities: ModelCapability[];
};

export async function resolveUserLlmConfig(
  prisma: LlmConfigPrisma,
  userId: string,
  defaults: {
    ollamaBaseUrl: string;
    openaiBaseUrl: string | undefined;
    openrouterBaseUrl: string | undefined;
    geminiBaseUrl: string | undefined;
    model: string;
    encryptionKey: string | undefined;
  },
  capability: ModelCapability,
): Promise<ResolvedLlmConfig> {
  const stored = await prisma.userLlmConfig.findUnique({
    where: { userId },
  });

  if (stored) {
    const resolvedProviderAndModel = resolveProviderAndModel(
      stored,
      capability,
    );
    return {
      userId,
      provider: resolvedProviderAndModel.provider,
      model: resolvedProviderAndModel.model,
      baseUrl: resolveBaseUrl(
        resolvedProviderAndModel.provider,
        stored.baseUrl ?? null,
        defaults,
      ),
      apiKey: decryptApiKey(
        stored.encryptedApiKey ?? null,
        defaults.encryptionKey,
      ),
      enabledCapabilities: stored.enabledCapabilities?.map((value) =>
        normalizeCapability(value),
      ) ?? [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
    };
  }

  return {
    userId,
    provider: MODEL_PROVIDER.OLLAMA,
    model: defaults.model,
    baseUrl: defaults.ollamaBaseUrl,
    apiKey: null,
    enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
  };
}

function resolveProviderAndModel(
  stored: StoredUserLlmConfig,
  capability: ModelCapability,
): { provider: ModelProvider; model: string } {
  if (stored.provider && stored.model) {
    return {
      provider: normalizeProvider(stored.provider, "provider"),
      model: stored.model,
    };
  }

  if (
    capability === MODEL_CAPABILITY.EMBEDDING &&
    stored.embeddingProvider &&
    stored.embeddingModel
  ) {
    return {
      provider: normalizeProvider(stored.embeddingProvider, "embedding"),
      model: stored.embeddingModel,
    };
  }

  if (stored.generationProvider && stored.generationModel) {
    return {
      provider: normalizeProvider(stored.generationProvider, "generation"),
      model: stored.generationModel,
    };
  }

  throw new Error("Stored user LLM configuration is incomplete");
}

function resolveBaseUrl(
  provider: ModelProvider,
  storedBaseUrl: string | null,
  defaults: {
    ollamaBaseUrl: string;
    openaiBaseUrl: string | undefined;
    openrouterBaseUrl: string | undefined;
    geminiBaseUrl: string | undefined;
  },
): string {
  if (storedBaseUrl && storedBaseUrl.trim().length > 0) {
    return storedBaseUrl;
  }

  if (provider === MODEL_PROVIDER.OLLAMA) {
    return defaults.ollamaBaseUrl;
  }
  if (provider === MODEL_PROVIDER.OPENAI) {
    if (defaults.openaiBaseUrl && defaults.openaiBaseUrl.trim().length > 0) {
      return defaults.openaiBaseUrl;
    }
    throw new Error("OpenAI base URL is required");
  }
  if (provider === MODEL_PROVIDER.OPENROUTER) {
    if (
      defaults.openrouterBaseUrl &&
      defaults.openrouterBaseUrl.trim().length > 0
    ) {
      return defaults.openrouterBaseUrl;
    }
    throw new Error("OpenRouter base URL is required");
  }
  if (defaults.geminiBaseUrl && defaults.geminiBaseUrl.trim().length > 0) {
    return defaults.geminiBaseUrl;
  }
  throw new Error("Gemini base URL is required");
}

function normalizeProvider(value: string, label: string): ModelProvider {
  if (value === MODEL_PROVIDER.OLLAMA) {
    return MODEL_PROVIDER.OLLAMA;
  }
  if (value === MODEL_PROVIDER.OPENAI) {
    return MODEL_PROVIDER.OPENAI;
  }
  if (value === MODEL_PROVIDER.OPENROUTER) {
    return MODEL_PROVIDER.OPENROUTER;
  }
  if (value === MODEL_PROVIDER.GEMINI) {
    return MODEL_PROVIDER.GEMINI;
  }
  throw new Error(`Unsupported ${label} provider: ${value}`);
}

function normalizeCapability(value: string): ModelCapability {
  if (value === MODEL_CAPABILITY.CHAT) {
    return MODEL_CAPABILITY.CHAT;
  }
  if (value === MODEL_CAPABILITY.EMBEDDING) {
    return MODEL_CAPABILITY.EMBEDDING;
  }
  throw new Error(`Unsupported capability: ${value}`);
}

function decryptApiKey(
  encryptedApiKey: string | null,
  encryptionKey: string | undefined,
): string | null {
  if (!encryptedApiKey) {
    return null;
  }

  if (!encryptionKey || encryptionKey.trim().length === 0) {
    throw new Error(
      "LLM_CONFIG_ENCRYPTION_KEY is required to decrypt API keys",
    );
  }

  return decryptSecret(encryptedApiKey, encryptionKey);
}
