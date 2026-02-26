import type { EmbeddingProvider } from "@repo/embeddings";
import type { VectorStore, VectorDocument } from "@repo/vector-store";
import { createLogger } from "@repo/logger";
import { Job, Queue } from "bullmq";
import {
  INGESTION_STATUS,
  JOB_TYPE,
  MODEL_CAPABILITY,
  type ModelProvider,
} from "@repo/shared-types";
import { resolveUserLlmConfig, type StoredUserLlmConfig } from "../llm-config";

const logger = createLogger("EmbeddingJob");

type ChunkWithDetails = {
  id: string;
  documentId: string;
  content: string;
  document: {
    title: string;
    DocumentTag: Array<{ tag: { name: string } }>;
  };
};

type EmbeddingJobPrisma = {
  document: {
    findUnique: (args: {
      where: { id: string };
      select?: { userId?: boolean };
    }) => Promise<{
      id: string;
      status: string;
      userId: string;
    } | null>;
    update: (args: {
      where: { id: string };
      data: { status?: string; processingError?: string | null };
    }) => Promise<{
      id: string;
      status: string;
      processingError: string | null;
    }>;
  };
  chunk: {
    findMany: (args: {
      where: { documentId: string };
      include: {
        document: {
          select: {
            title: true;
            DocumentTag: { include: { tag: true } };
          };
        };
      };
    }) => Promise<ChunkWithDetails[]>;
  };
  userLlmConfig: {
    findUnique: (args: {
      where: { userId: string };
    }) => Promise<StoredUserLlmConfig | null>;
  };
};

const BATCH_SIZE = 10;

export async function handleEmbeddingJob(
  job: Job<{ documentId: string; userId?: string }, void, string>,
  prisma: EmbeddingJobPrisma,
  vectorStore: VectorStore,
  ingestionQueue: Queue,
  defaults: {
    ollamaBaseUrl: string;
    openaiBaseUrl: string | undefined;
    openrouterBaseUrl: string | undefined;
    geminiBaseUrl: string | undefined;
    model: string;
    encryptionKey: string | undefined;
  },
  createEmbeddingProvider: (config: {
    provider: ModelProvider;
    model: string;
    baseUrl: string;
    apiKey: string | null;
  }) => EmbeddingProvider,
): Promise<void> {
  const { documentId } = job.data;
  let activeModel = defaults.model;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    logger.error("Document not found", { documentId });
    throw new Error(`Document not found: ${documentId}`);
  }

  if (
    document.status !== INGESTION_STATUS.EMBEDDING &&
    document.status !== INGESTION_STATUS.CHUNKING
  ) {
    logger.warn("Skipping embedding, document in wrong state", {
      documentId,
      status: document.status,
    });
    return;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: INGESTION_STATUS.EMBEDDING, processingError: null },
  });

  try {
    const userId = job.data.userId ?? document.userId;
    const config = await resolveUserLlmConfig(
      prisma,
      userId,
      defaults,
      MODEL_CAPABILITY.EMBEDDING,
    );
    activeModel = config.model;

    if (!config.enabledCapabilities.includes(MODEL_CAPABILITY.EMBEDDING)) {
      throw new Error(
        "Embedding capability is disabled in user LLM configuration",
      );
    }

    const embeddingProvider = createEmbeddingProvider({
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    });

    const chunks = await prisma.chunk.findMany({
      where: { documentId },
      include: {
        document: {
          select: {
            title: true,
            DocumentTag: { include: { tag: true } },
          },
        },
      },
    });

    if (chunks.length === 0) {
      logger.warn("No chunks found for document", { documentId });
      await prisma.document.update({
        where: { id: documentId },
        data: { status: INGESTION_STATUS.READY },
      });
      return;
    }

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c: ChunkWithDetails) => c.content);

      const embeddings = await embeddingProvider.embedBatch(texts);

      const documents: VectorDocument[] = batch.map(
        (chunk: ChunkWithDetails, idx: number) => {
          const embeddingResult = embeddings[idx];
          if (!embeddingResult) {
            throw new Error(`No embedding returned for chunk ${chunk.id}`);
          }
          return {
            id: chunk.id,
            embedding: embeddingResult.embedding,
            content: chunk.content,
            metadata: {
              documentId: chunk.documentId,
              documentTitle: chunk.document.title,
              tags: chunk.document.DocumentTag.map((dt) => dt.tag.name).join(
                ",",
              ),
            },
          };
        },
      );

      await vectorStore.upsert(documents);

      logger.debug("Embedded batch", {
        documentId,
        batchStart: i,
        batchSize: batch.length,
      });
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: INGESTION_STATUS.GRAPH_BUILDING },
    });

    await ingestionQueue.add(JOB_TYPE.CONCEPT_EXTRACTION, {
      documentId,
      userId,
    });

    logger.info("Embedding completed", {
      documentId,
      chunkCount: chunks.length,
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message =
      rawMessage.toLowerCase().includes("not found") &&
      rawMessage.toLowerCase().includes("ollama")
        ? `Ollama model '${activeModel}' is not available. Run 'ollama pull ${activeModel}' and retry.`
        : rawMessage;
    await prisma.document.update({
      where: { id: documentId },
      data: { status: INGESTION_STATUS.FAILED, processingError: message },
    });
    logger.error("Embedding failed", { documentId, error: message });
    throw error;
  }
}
