import { MODEL_PROVIDER, type ModelProvider } from "@repo/shared-types";

export type LlmConfigPrisma = {
  userLlmConfig: {
    findUnique: (args: { where: { userId: string } }) => Promise<{
      embeddingProvider: string;
      embeddingModel: string;
      generationProvider: string;
      generationModel: string;
    } | null>;
  };
};

type LlmConfigRow = {
  embeddingProvider: string;
  embeddingModel: string;
  generationProvider: string;
  generationModel: string;
};

export type LlmConfigPrismaQueryResult = Array<LlmConfigRow>;

export type ResolvedLlmConfig = {
  userId: string;
  embeddingProvider: ModelProvider;
  embeddingModel: string;
  generationProvider: ModelProvider;
  generationModel: string;
  baseUrl: string;
};

export async function resolveUserLlmConfig(
  prisma: LlmConfigPrisma,
  userId: string,
  defaults: {
    baseUrl: string;
    embeddingModel: string;
    generationModel: string;
  },
): Promise<ResolvedLlmConfig> {
  const stored = await prisma.userLlmConfig.findUnique({
    where: { userId },
  });

  if (stored) {
    const embeddingProvider = normalizeProvider(
      stored.embeddingProvider,
      "embedding",
    );
    const generationProvider = normalizeProvider(
      stored.generationProvider,
      "generation",
    );
    return {
      userId,
      embeddingProvider,
      embeddingModel: stored.embeddingModel,
      generationProvider,
      generationModel: stored.generationModel,
      baseUrl: defaults.baseUrl,
    };
  }

  return {
    userId,
    embeddingProvider: MODEL_PROVIDER.OLLAMA,
    embeddingModel: defaults.embeddingModel,
    generationProvider: MODEL_PROVIDER.OLLAMA,
    generationModel: defaults.generationModel,
    baseUrl: defaults.baseUrl,
  };
}

function normalizeProvider(value: string, label: string): ModelProvider {
  if (value === MODEL_PROVIDER.OLLAMA) {
    return MODEL_PROVIDER.OLLAMA;
  }
  throw new Error(`Unsupported ${label} provider: ${value}`);
}
