import { Prisma, PrismaClient } from "@repo/database";
import { createLogger } from "@repo/logger";
import { randomUUID } from "node:crypto";
import { Job, Queue } from "bullmq";
import { JOB_TYPE } from "@repo/shared-types";

const logger = createLogger("ChunkingJob");

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export async function handleChunkingJob(
  job: Job<{ documentId: string }, any, string>,
  prisma: PrismaClient,
  ingestionQueue: Queue,
): Promise<void> {
  const { documentId } = job.data;
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error(`Document not found: ${documentId}`);
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  });

  try {
    const content = document.rawContent;
    const chunks = splitIntoChunks(content, CHUNK_SIZE, CHUNK_OVERLAP);

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
      data: { status: "COMPLETED" },
    });

    await ingestionQueue.add(JOB_TYPE.EMBEDDING, { documentId });

    logger.info("Chunking completed", {
      documentId: documentId,
      chunkCount: chunks.length,
    });
  } catch (error) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

interface ChunkData {
  content: string;
  startOffset: number;
  endOffset: number;
}

function splitIntoChunks(
  text: string,
  chunkSize: number,
  overlap: number,
): ChunkData[] {
  const chunks: ChunkData[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";
  let startOffset = 0;
  let currentOffset = 0;

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

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      startOffset,
      endOffset: currentOffset,
    });
  }

  return chunks;
}
