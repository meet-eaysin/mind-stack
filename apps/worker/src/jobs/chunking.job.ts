import { Prisma, PrismaClient } from "@repo/database";
import { createLogger } from "@repo/logger";
import { randomUUID } from "node:crypto";

const logger = createLogger("ChunkingJob");

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export async function handleChunkingJob(
  data: { documentId: string },
  prisma: PrismaClient,
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: data.documentId },
  });

  if (!document) {
    throw new Error(`Document not found: ${data.documentId}`);
  }

  await prisma.document.update({
    where: { id: data.documentId },
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
            documentId: data.documentId,
            content: chunk.content,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
          },
        });
      }
    });

    await prisma.document.update({
      where: { id: data.documentId },
      data: { status: "COMPLETED" },
    });

    logger.info("Chunking completed", {
      documentId: data.documentId,
      chunkCount: chunks.length,
    });
  } catch (error) {
    await prisma.document.update({
      where: { id: data.documentId },
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
