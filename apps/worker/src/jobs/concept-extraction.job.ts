import type { PrismaClient } from "@repo/database";
import type { LLMProvider } from "@repo/llm";
import { createLogger } from "@repo/logger";
import { randomUUID } from "node:crypto";
import { RELATION_TYPE } from "@repo/shared-types";
import { Job } from "bullmq";

const logger = createLogger("ConceptExtractionJob");

const ROOT_LABEL = "user brain";
const DOCUMENT_PREFIX = "doc:";

export async function handleConceptExtractionJob(
  job: Job<{ documentId: string }, void, string>,
  prisma: PrismaClient,
  llmProvider: LLMProvider,
): Promise<void> {
  const { documentId } = job.data;
  void llmProvider;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    logger.error("Document not found", { documentId });
    throw new Error(`Document not found: ${documentId}`);
  }

  if (document.status !== "GRAPH_BUILDING" && document.status !== "EMBEDDING") {
    logger.warn("Skipping graph sync, document in wrong state", {
      documentId,
      status: document.status,
    });
    return;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "GRAPH_BUILDING" },
  });

  try {
    const root = await findOrCreateConcept(prisma, ROOT_LABEL);
    const docLabel = `${DOCUMENT_PREFIX}${document.id}`;
    const docNode = await findOrCreateConcept(prisma, docLabel);

    await prisma.conceptRelation.upsert({
      where: {
        fromConceptId_toConceptId_relationType: {
          fromConceptId: docNode.id,
          toConceptId: root.id,
          relationType: RELATION_TYPE.IS_PART_OF,
        },
      },
      create: {
        id: randomUUID(),
        fromConceptId: docNode.id,
        toConceptId: root.id,
        relationType: RELATION_TYPE.IS_PART_OF,
      },
      update: {},
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    });
  } catch (error) {
    logger.error("Failed to sync document graph", {
      error: error instanceof Error ? error.message : String(error),
    });
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

async function findOrCreateConcept(prisma: PrismaClient, label: string) {
  const existing = await prisma.concept.findUnique({
    where: { label },
  });
  if (existing) return existing;
  return prisma.concept.create({
    data: {
      id: randomUUID(),
      label,
    },
  });
}
