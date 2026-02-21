import { Worker, Queue, ConnectionOptions } from "bullmq";
import { loadConfig } from "@repo/config";
import { createLogger } from "@repo/logger";
import { OllamaEmbeddingProvider } from "@repo/embeddings";
import { OllamaLLMProvider } from "@repo/llm";
import { ChromaVectorStore } from "@repo/vector-store";
import { PrismaClient } from "@repo/database";
import { JOB_TYPE } from "@repo/shared-types";
import { handleChunkingJob } from "./jobs/chunking.job";
import { handleEmbeddingJob } from "./jobs/embedding.job";
import { handleConceptExtractionJob } from "./jobs/concept-extraction.job";
import { handleDailyReviewJob } from "./jobs/daily-review.job";

const logger = createLogger("Worker");

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

  const embeddingProvider = new OllamaEmbeddingProvider({
    baseUrl: config.OLLAMA_BASE_URL,
    model: config.OLLAMA_EMBED_MODEL,
  });

  const llmProvider = new OllamaLLMProvider({
    baseUrl: config.OLLAMA_BASE_URL,
    model: config.OLLAMA_MODEL,
  });

  const vectorStore = new ChromaVectorStore(
    config.CHROMA_URL,
    config.CHROMA_COLLECTION,
  );

  const worker = new Worker<{ documentId: string }, void, string>(
    "ingestion",
    async (job) => {
      console.log(
        `[DEBUG] Received job: ${job.name} for document: ${job.data.documentId}`,
      );
      logger.info(`Processing job ${job.name}`, {
        jobId: job.id,
        data: job.data,
      });

      switch (job.name) {
        case JOB_TYPE.CHUNKING:
          await handleChunkingJob(job, prisma, ingestionQueue);
          break;

        case JOB_TYPE.EMBEDDING:
          await handleEmbeddingJob(
            job,
            prisma,
            embeddingProvider,
            vectorStore,
            ingestionQueue,
          );
          break;

        case JOB_TYPE.CONCEPT_EXTRACTION:
          await handleConceptExtractionJob(job, prisma, llmProvider);
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
