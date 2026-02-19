import type { PrismaClient, Prisma } from "@repo/database";
import type { EmbeddingProvider } from "@repo/embeddings";
import type { VectorStore, VectorDocument } from "@repo/vector-store";
import { createLogger } from "@repo/logger";
import { Job, Queue } from "bullmq";
import { JOB_TYPE } from "@repo/shared-types";

const logger = createLogger("EmbeddingJob");

type ChunkWithDetails = Prisma.ChunkGetPayload<{
  include: {
    document: { select: { title: true } };
    chunkTags: { include: { tag: true } };
  };
}>;

const BATCH_SIZE = 10;

export async function handleEmbeddingJob(
  job: Job<{ documentId: string }, any, string>,
  prisma: PrismaClient,
  embeddingProvider: EmbeddingProvider,
  vectorStore: VectorStore,
  ingestionQueue: Queue,
): Promise<void> {
  const { documentId } = job.data;
  const chunks = await prisma.chunk.findMany({
    where: { documentId },
    include: {
      document: { select: { title: true } },
      chunkTags: { include: { tag: true } },
    },
  });

  if (chunks.length === 0) {
    logger.warn("No chunks found for document", {
      documentId,
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
            tags: chunk.chunkTags.map((ct) => ct.tag.name).join(","),
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

  await ingestionQueue.add(JOB_TYPE.CONCEPT_EXTRACTION, { documentId });

  logger.info("Embedding completed", {
    documentId,
    chunkCount: chunks.length,
  });
}
