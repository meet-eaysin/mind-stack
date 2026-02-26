import { Worker, Queue, ConnectionOptions } from "bullmq";
import { loadConfig } from "@repo/config";
import { createLogger } from "@repo/logger";
import {
  GeminiEmbeddingProvider,
  OllamaEmbeddingProvider,
  OpenAIEmbeddingProvider,
  OpenRouterEmbeddingProvider,
  type EmbeddingProvider,
} from "@repo/embeddings";
import {
  GeminiLLMProvider,
  OllamaLLMProvider,
  OpenAILLMProvider,
  OpenRouterLLMProvider,
  type LLMProvider,
} from "@repo/llm";
import { ChromaVectorStore } from "@repo/vector-store";
import { PrismaClient } from "@repo/database";
import {
  JOB_TYPE,
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
  type ModelProvider,
} from "@repo/shared-types";
import { handleChunkingJob } from "./jobs/chunking.job";
import { handleEmbeddingJob } from "./jobs/embedding.job";
import { handleConceptExtractionJob } from "./jobs/concept-extraction.job";
import { handleDailyReviewJob } from "./jobs/daily-review.job";
import { handleUrlExtractionJob } from "./jobs/url-extraction.job";
import { resolveUserLlmConfig } from "./llm-config";

const logger = createLogger("Worker");

type RuntimeProviderConfig = {
  provider: ModelProvider;
  model: string;
  baseUrl: string;
  apiKey: string | null;
};

function requireApiKey(config: RuntimeProviderConfig): string {
  if (config.apiKey && config.apiKey.trim().length > 0) {
    return config.apiKey;
  }
  throw new Error(`Provider ${config.provider} requires an API key`);
}

function createEmbeddingProvider(
  config: RuntimeProviderConfig,
): EmbeddingProvider {
  if (config.provider === MODEL_PROVIDER.OLLAMA) {
    return new OllamaEmbeddingProvider({
      baseUrl: config.baseUrl,
      model: config.model,
    });
  }

  const apiKey = requireApiKey(config);

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

function createGenerationProvider(config: RuntimeProviderConfig): LLMProvider {
  if (config.provider === MODEL_PROVIDER.OLLAMA) {
    return new OllamaLLMProvider({
      baseUrl: config.baseUrl,
      model: config.model,
    });
  }

  const apiKey = requireApiKey(config);

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

async function main(): Promise<void> {
  const config = loadConfig();
  const prisma = new PrismaClient();
  await prisma.$connect();

  const redisUrl = new URL(config.REDIS_URL);
  const connection: ConnectionOptions = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port),
    maxRetriesPerRequest: null,
  };

  if (redisUrl.password) {
    connection.password = redisUrl.password;
  }
  if (redisUrl.username) {
    connection.username = redisUrl.username;
  }

  const ingestionQueue = new Queue("ingestion", {
    connection,
  });

  const vectorStore = new ChromaVectorStore(
    config.CHROMA_URL,
    config.CHROMA_COLLECTION,
  );

  const worker = new Worker<
    { documentId: string; userId?: string },
    void,
    string
  >(
    "ingestion",
    async (job) => {
      logger.info(`Processing job ${job.name}`, {
        jobId: job.id,
        data: job.data,
      });

      switch (job.name) {
        case JOB_TYPE.URL_EXTRACTION:
          await handleUrlExtractionJob(
            job,
            prisma,
            async (userId: string): Promise<LLMProvider> => {
              const cfg = await resolveUserLlmConfig(
                prisma,
                userId,
                {
                  ollamaBaseUrl: config.OLLAMA_BASE_URL,
                  openaiBaseUrl: config.OPENAI_BASE_URL,
                  openrouterBaseUrl: config.OPENROUTER_BASE_URL,
                  geminiBaseUrl: config.GEMINI_BASE_URL,
                  model: config.OLLAMA_MODEL,
                  encryptionKey: config.LLM_CONFIG_ENCRYPTION_KEY,
                },
                MODEL_CAPABILITY.CHAT,
              );

              if (!cfg.enabledCapabilities.includes(MODEL_CAPABILITY.CHAT)) {
                throw new Error(
                  "Chat capability is disabled in user LLM configuration",
                );
              }

              return createGenerationProvider({
                provider: cfg.provider,
                model: cfg.model,
                baseUrl: cfg.baseUrl,
                apiKey: cfg.apiKey,
              });
            },
            ingestionQueue,
          );
          break;

        case JOB_TYPE.CHUNKING:
          await handleChunkingJob(job, prisma, ingestionQueue);
          break;

        case JOB_TYPE.EMBEDDING:
          await handleEmbeddingJob(
            job,
            prisma,
            vectorStore,
            ingestionQueue,
            {
              ollamaBaseUrl: config.OLLAMA_BASE_URL,
              openaiBaseUrl: config.OPENAI_BASE_URL,
              openrouterBaseUrl: config.OPENROUTER_BASE_URL,
              geminiBaseUrl: config.GEMINI_BASE_URL,
              model: config.OLLAMA_MODEL,
              encryptionKey: config.LLM_CONFIG_ENCRYPTION_KEY,
            },
            createEmbeddingProvider,
          );
          break;

        case JOB_TYPE.CONCEPT_EXTRACTION:
          {
            const document = await prisma.document.findUnique({
              where: { id: job.data.documentId },
              select: { userId: true },
            });
            const userId = job.data.userId ?? document?.userId ?? "default";

            const cfg = await resolveUserLlmConfig(
              prisma,
              userId,
              {
                ollamaBaseUrl: config.OLLAMA_BASE_URL,
                openaiBaseUrl: config.OPENAI_BASE_URL,
                openrouterBaseUrl: config.OPENROUTER_BASE_URL,
                geminiBaseUrl: config.GEMINI_BASE_URL,
                model: config.OLLAMA_MODEL,
                encryptionKey: config.LLM_CONFIG_ENCRYPTION_KEY,
              },
              MODEL_CAPABILITY.CHAT,
            );

            if (!cfg.enabledCapabilities.includes(MODEL_CAPABILITY.CHAT)) {
              throw new Error(
                "Chat capability is disabled in user LLM configuration",
              );
            }

            await handleConceptExtractionJob(
              job,
              prisma,
              createGenerationProvider({
                provider: cfg.provider,
                model: cfg.model,
                baseUrl: cfg.baseUrl,
                apiKey: cfg.apiKey,
              }),
            );
          }
          break;

        case JOB_TYPE.DAILY_REVIEW:
          await handleDailyReviewJob(prisma);
          break;

        default:
          logger.warn(`Unknown job type: ${job.name}`);
      }
    },
    { connection, concurrency: 1 },
  );

  worker.on("completed", (job) => {
    logger.info(`Job completed: ${job.name}`, { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job failed: ${job?.name ?? "unknown"}`, {
      jobId: job?.id,
      error: err.message,
    });
  });

  logger.info("Worker started, waiting for jobs...");

  const shutdown = async (): Promise<void> => {
    logger.info("Shutting down worker...");
    await worker.close();
    await ingestionQueue.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

void main();
