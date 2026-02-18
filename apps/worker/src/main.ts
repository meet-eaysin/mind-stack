import { Worker, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "@repo/config";
import { createLogger } from "@repo/logger";
import { OllamaEmbeddingProvider } from "@repo/embeddings";
import { OllamaLLMProvider } from "@repo/llm";
import { ChromaVectorStore } from "@repo/vector-store";
import { PrismaClient } from "@repo/database";
import { JOB_TYPE } from "@repo/shared-types";
import { handleChunkingJob } from "./jobs/chunking.job.js";
import { handleEmbeddingJob } from "./jobs/embedding.job.js";
import { handleConceptExtractionJob } from "./jobs/concept-extraction.job.js";
import { handleDailyReviewJob } from "./jobs/daily-review.job.js";

const logger = createLogger("Worker");

async function main(): Promise<void> {
  const config = loadConfig();
  const prisma = new PrismaClient();
  await prisma.$connect();

  const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const embeddingProvider = new OllamaEmbeddingProvider(
    config.OLLAMA_BASE_URL,
    config.OLLAMA_EMBED_MODEL
  );

  const llmProvider = new OllamaLLMProvider(
    config.OLLAMA_BASE_URL,
    config.OLLAMA_MODEL
  );

  const vectorStore = new ChromaVectorStore(
    config.CHROMA_URL,
    config.CHROMA_COLLECTION
  );

  const worker = new Worker(
    "ingestion",
    async (job) => {
      logger.info(`Processing job ${job.name}`, {
        jobId: job.id,
        data: job.data as Record<string, unknown>,
      });

      switch (job.name) {
        case JOB_TYPE.CHUNKING:
          await handleChunkingJob(
            job.data as { documentId: string },
            prisma
          );
          break;

        case JOB_TYPE.EMBEDDING:
          await handleEmbeddingJob(
            job.data as { documentId: string },
            prisma,
            embeddingProvider,
            vectorStore
          );
          break;

        case JOB_TYPE.CONCEPT_EXTRACTION:
          await handleConceptExtractionJob(
            job.data as { documentId: string },
            prisma,
            llmProvider
          );
          break;

        case JOB_TYPE.DAILY_REVIEW:
          await handleDailyReviewJob(prisma);
          break;

        default:
          logger.warn(`Unknown job type: ${job.name}`);
      }
    },
    { connection: connection as unknown as ConnectionOptions, concurrency: 2 }
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
    await prisma.$disconnect();
    connection.disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

void main();
