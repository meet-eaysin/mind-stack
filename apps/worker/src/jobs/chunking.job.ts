import { Prisma, PrismaClient } from "@repo/database";
import { createLogger } from "@repo/logger";
import { randomUUID } from "node:crypto";
import { Job, Queue } from "bullmq";
import { INGESTION_STATUS, JOB_TYPE } from "@repo/shared-types";

const logger = createLogger("ChunkingJob");

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export async function handleChunkingJob(
  job: Job<{ documentId: string; userId?: string }, void, string>,
  prisma: PrismaClient,
  ingestionQueue: Queue,
): Promise<void> {
  const { documentId } = job.data;
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    logger.error("Document not found", { documentId });
    throw new Error(`Document not found: ${documentId}`);
  }

  // Idempotency check: if chunks already exist, we might be retrying.
  const existingChunks = await prisma.chunk.count({ where: { documentId } });
  if (existingChunks > 0) {
    logger.info("Chunks already exist, skipping chunking", { documentId });
    await prisma.document.update({
      where: { id: documentId },
      data: { status: INGESTION_STATUS.EMBEDDING, processingError: null },
    });
    await ingestionQueue.add(JOB_TYPE.EMBEDDING, {
      documentId,
      userId: job.data.userId ?? "default",
    });
    return;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: INGESTION_STATUS.CHUNKING, processingError: null },
  });

  try {
    const content = document.rawContent;
    const chunks = splitIntoChunks(content, CHUNK_SIZE, CHUNK_OVERLAP);
    if (chunks.length === 0) {
      throw new Error(`Failed to produce chunks for document: ${documentId}`);
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const chunk of chunks) {
        await tx.chunk.create({
          data: {
            id: randomUUID(),
            documentId: documentId,
            content: chunk.content,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
          },
        });
      }
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: INGESTION_STATUS.EMBEDDING, processingError: null },
    });

    await ingestionQueue.add(JOB_TYPE.EMBEDDING, {
      documentId,
      userId: job.data.userId ?? "default",
    });

    logger.info("Chunking completed", {
      documentId: documentId,
      chunkCount: chunks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: INGESTION_STATUS.FAILED, processingError: message },
    });
    logger.error("Chunking failed", { documentId, error: message });
    throw error;
  }
}

type ChunkData = {
  content: string;
  startOffset: number;
  endOffset: number;
};

function splitIntoChunks(
  text: string,
  chunkSize: number,
  overlap: number,
): ChunkData[] {
  const chunks: ChunkData[] = [];

  // Split by double newlines first (paragraphs/Markdown blocks)
  const blocks = text.split(/\n\s*\n/);

  let currentChunk = "";
  let startOffset = 0;
  let currentOffset = 0;

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) {
      currentOffset += block.length;
      continue;
    }

    // Determine if this block alone is already close to or exceeding chunk size
    if (trimmedBlock.length > chunkSize) {
      // If we have a pending chunk, push it
      if (currentChunk.trim().length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          startOffset,
          endOffset: currentOffset,
        });

        const overlapText = currentChunk.slice(-overlap);
        startOffset = currentOffset - overlapText.length;
        currentChunk = overlapText;
      } else {
        startOffset = currentOffset;
      }

      // Large block: split into smaller pieces (sentences or fixed size)
      // For Markdown, we prefer sentences to avoid breaking syntax mid-line
      const sentences = trimmedBlock.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (
          currentChunk.length + sentence.length > chunkSize &&
          currentChunk.length > 0
        ) {
          chunks.push({
            content: currentChunk.trim(),
            startOffset,
            endOffset: currentOffset,
          });
          const overlapText = currentChunk.slice(-overlap);
          startOffset = currentOffset - overlapText.length;
          currentChunk = overlapText + sentence;
        } else {
          currentChunk += (currentChunk.length > 0 ? " " : "") + sentence;
        }
        currentOffset += sentence.length + 1;
      }
    } else if (
      currentChunk.length + trimmedBlock.length > chunkSize &&
      currentChunk.length > 0
    ) {
      // Current block fits but exceeds chunk total: push current and start new
      chunks.push({
        content: currentChunk.trim(),
        startOffset,
        endOffset: currentOffset,
      });

      const overlapText = currentChunk.slice(-overlap);
      startOffset = currentOffset - overlapText.length;
      currentChunk = overlapText + trimmedBlock;
      currentOffset += block.length;
    } else {
      // Append block to current chunk
      currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + trimmedBlock;
      currentOffset += block.length;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      startOffset,
      endOffset: currentOffset,
    });
  }

  return chunks;
}
